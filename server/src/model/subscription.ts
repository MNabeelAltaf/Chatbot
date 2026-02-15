import { pool } from "../lib/db";

export const subscriptionPlanModel = async () => {
    const db = await pool.connect();
    try {
        const res = await db.query(
            `SELECT id, subscription_type, billing_cycle, price, max_message FROM subscription_plans`
        );
        return res.rows;
    }
    catch (error) {
        console.log('Error:', error)
    }
    finally {
        db.release();
    }
};


interface PurchaseInput {
    user_id: number;
    subscription_id: number;
    chat_token: string;
    auto_renew: boolean;
    card_number: string;
    cvc: number;
    card_expiry_date: string;
}

export const purchaseSubscriptionModel = async (data: PurchaseInput) => {
    const db = await pool.connect();

    try {

        await db.query("BEGIN");

        const insertPaymentQuery = `
            INSERT INTO payments 
            (user_id, subscription_id, chat_token, auto_renew, card_number, cvc, card_expiry_date) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
            `;

        const values = [
            data.user_id,
            data.subscription_id,
            data.chat_token,
            data.auto_renew,
            data.card_number,
            data.cvc,
            data.card_expiry_date,
        ];

        const paymentResult = await db.query(insertPaymentQuery, values);

        const payment = paymentResult.rows[0];


        // updating "users" table
        await db.query(
            `UPDATE users 
            SET subscription_status = 1, subscription_id = $1
            WHERE id = $2;`,
            [data.subscription_id, data.user_id]
        );


        // get all data from subscription_plans table
        const planResult = await db.query(
            `SELECT id, subscription_type, billing_cycle, price, max_message 
             FROM subscription_plans WHERE id = $1;`,
            [data.subscription_id]
        );

        if (planResult.rows.length === 0) {
            throw new Error("Subscription plan not found");
        }



        const plan = planResult.rows[0];


        let userMessagesLimit: number;
        if (plan.max_message.toLowerCase() === "unlimited") {
            userMessagesLimit = 0;
        } else {
            userMessagesLimit = parseInt(plan.max_message, 10);
            if (isNaN(userMessagesLimit)) {
                throw new Error("Invalid max_message value in subscription plan");
            }
        }

        const now = new Date();
        const subscriptionDate = now.toISOString().split("T")[0];
        const endDate = new Date(now);

        if (plan.billing_cycle.toLowerCase() === "monthly") {
            endDate.setDate(now.getDate() + 30);
        } else if (plan.billing_cycle.toLowerCase() === "yearly") {
            endDate.setFullYear(now.getFullYear() + 1);
        }

        const subscriptionEndDate = endDate.toISOString().split("T")[0];


        const diffTime = endDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));


        // insert purchased subscription-plan data to settings table 
        const insertSettingsQuery = `
                INSERT INTO settings 
                (user_id, subscription_id, user_messages_limit, user_subscription_date, 
                user_subscription_end_date, subscription_end_daysleft, subscription_autorenewal)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (user_id) DO UPDATE
                SET 
                subscription_id = EXCLUDED.subscription_id,
                user_messages_limit = EXCLUDED.user_messages_limit,
                user_subscription_date = EXCLUDED.user_subscription_date,
                user_subscription_end_date = EXCLUDED.user_subscription_end_date,
                subscription_end_daysleft = EXCLUDED.subscription_end_daysleft,
                subscription_autorenewal = EXCLUDED.subscription_autorenewal
            `;

        const settingsValues = [
            data.user_id,
            plan.id,
            userMessagesLimit,
            subscriptionDate,
            subscriptionEndDate,
            daysLeft,
            data.auto_renew,
        ];

        await db.query(insertSettingsQuery, settingsValues);

        await db.query("COMMIT");

        return {
            message: "Subscription purchased successfully",
            payment,
            plan,
        };

    }
    catch (err) {
        await db.query("ROLLBACK");
        throw err;
    }
    finally {
        db.release();
    }
}





interface CancelSubscriptionInput {
    user_id: number;
    chat_token: string;
}

export const cancelSubscriptionModel = async ({ user_id, chat_token }: CancelSubscriptionInput) => {
    const db = await pool.connect();

    try {
        await db.query("BEGIN");


        await db.query(
            `DELETE FROM payments
       WHERE user_id = $1 AND chat_token = $2`,
            [user_id, chat_token]
        );

        await db.query(
            `UPDATE settings
       SET subscription_id = null,
           user_messages_limit = 3,
           user_subscription_date = null,
           user_subscription_end_date = null,
           subscription_end_daysleft = null,
           subscription_autorenewal = false
       WHERE user_id = $1`,
            [user_id]
        );


        await db.query(
            `UPDATE users
       SET subscription_status = 0,
           subscription_id = null
       WHERE id = $1`,
            [user_id]
        );

        await db.query("COMMIT");

        return { message: "Subscription Cancelled" };
    } catch (err) {
        await db.query("ROLLBACK");
        console.error("Error canceling subscription in DB:", err);
        throw err;
    } finally {
        db.release();
    }
};
