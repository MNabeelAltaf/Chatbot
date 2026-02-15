import crypto from "crypto";
import { pool } from "../lib/db";

export const createChatUser = async () => {
    const db = await pool.connect();

    try {
        const chat_token = crypto.randomBytes(16).toString("hex");
        const subscription_status = 0;
        const subscription_id = null;


        const userInsert = await db.query(
            `INSERT INTO users (chat_token)
            VALUES ($1)
            RETURNING id`,
            [chat_token]
        );

        const user_id = userInsert.rows[0].id;


        const settingsInsert = await db.query(
            `INSERT INTO settings (user_id, subscription_id)
             VALUES ($1, $2)
             RETURNING *`,
            [user_id, subscription_id]
        );

        const settingsData = settingsInsert.rows[0];

        const data = {
            user_id,
            chat_token,
            subscription_status,
            subscription_id,
            settingsData,
            message: "User and settings created successfully",
        };

        return data;
    } catch (err) {
        throw err;
    } finally {
        db.release();
    }
};


interface SaveChatInput {
    user_id: number;
    chat_token: string;
    question: string;
    answer: string;
}

export const saveChatModel = async ({ user_id, chat_token, question, answer }: SaveChatInput) => {
    const db = await pool.connect();
    try {

        const settingsRes = await db.query(`SELECT * FROM settings WHERE user_id = $1`, [user_id]);

        if (!settingsRes.rows.length) {
            throw new Error("User settings not found.");
        }

        const settings = settingsRes.rows[0];


        if (!settings.subscription_id && settings.user_messages_limit <= 0) {
            throw new Error("Free response limit reached. Please subscribe.");
        }


        await db.query(
            `INSERT INTO user_chat (user_id, chat_token, question, answer)
             VALUES ($1, $2, $3, $4)`,
            [user_id, chat_token, question, answer]
        );



        let remaining_limit = settings.user_messages_limit;
        if (!settings.subscription_id) {
            const updateRes = await db.query(
                `UPDATE settings
                SET user_messages_limit = user_messages_limit - 1
                WHERE user_id = $1
                RETURNING user_messages_limit`,
                [user_id]
            );
            remaining_limit = updateRes.rows[0].user_messages_limit;
        }

        return { user_id, remaining_limit };
    } finally {
        db.release();
    }
};


interface GetChatInput {
    user_id: number;
    chat_token: string;
}

export const getChatModel = async ({ user_id, chat_token }: GetChatInput) => {
    const db = await pool.connect();
    try {

        const res = await db.query(
            `SELECT question, answer 
       FROM user_chat 
       WHERE user_id = $1 AND chat_token = $2 
       ORDER BY id ASC`,
            [user_id, chat_token]
        );

        // Map to frontend message format
        const chats = res.rows.flatMap((row: any) => [
            { type: "user", text: row.question },
            { type: "bot", text: row.answer },
        ]);

        return chats;
    } finally {
        db.release();
    }
};


