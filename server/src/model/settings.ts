import { pool } from "../lib/db";

interface GetSettingsData {
  user_id: number;
  chat_token: string;
}

export const getSettingsModel = async ({ user_id, chat_token }: GetSettingsData) => {
  const db = await pool.connect();
  try {
    const query = `
      SELECT s.*, u.chat_token
      FROM settings s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = $1 AND u.chat_token = $2
      LIMIT 1;
    `;

    const result = await db.query(query, [user_id, chat_token]);
    return result.rows[0] || null;
  } catch (err) {
    console.error("Error fetching settings:", err);
    throw err;
  } finally {
    db.release();
  }
};



export const getDetailedSettingsModel = async ({ user_id, chat_token }: GetSettingsData) => {
  const db = await pool.connect();

  try {

    const settingsQuery = `
      SELECT s.*, u.chat_token
      FROM settings s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = $1 AND u.chat_token = $2
      LIMIT 1;
    `;
    const settingsResult = await db.query(settingsQuery, [user_id, chat_token]);
    const settings = settingsResult.rows[0];
    if (!settings) return null;


    const paymentsQuery = `
      SELECT *
      FROM payments
      WHERE user_id = $1 AND chat_token = $2
      ORDER BY created_at DESC;
    `;
    const paymentsResult = await db.query(paymentsQuery, [user_id, chat_token]);
    const payments = paymentsResult.rows;


    const messagesQuery = `
      SELECT COUNT(*) as consumed_messages
      FROM user_chat
      WHERE user_id = $1 AND chat_token = $2;
    `;
    const messagesResult = await db.query(messagesQuery, [user_id, chat_token]);

    const consumedMessages = parseInt(messagesResult.rows[0]?.consumed_messages || "0", 10);
    const freeMessages = 3;

    let remainingMessages = 0;

    if (settings.user_messages_limit === 0) {
      remainingMessages = 0;
    } else {

      const adjustedConsumed = consumedMessages > freeMessages ? consumedMessages - freeMessages : 0;
      remainingMessages = settings.user_messages_limit - adjustedConsumed;
    }


    return {
      settings,
      payments,
      consumedMessages,
      remainingMessages,
    };
  } catch (err) {
    console.error("Error fetching settings with payments:", err);
    throw err;
  } finally {
    db.release();
  }
}


interface UpdateAutoRenewData {
  user_id: number;
  chat_token: string;
  subscription_autorenewal: boolean;
}

export const updateAutoRenewModel = async ({
  user_id,
  chat_token,
  subscription_autorenewal,
}: UpdateAutoRenewData) => {
  const db = await pool.connect();

  try {
    await db.query("BEGIN");


    const updatePayments = `
      UPDATE payments
      SET auto_renew = $3, updated_at = NOW()
      WHERE user_id = $1 AND chat_token = $2
      RETURNING *;
    `;
    const paymentsResult = await db.query(updatePayments, [user_id, chat_token, subscription_autorenewal]);

    const updateSettings = `
      UPDATE settings
      SET subscription_autorenewal = $2
      WHERE user_id = $1
      RETURNING *;
    `;
    const settingsResult = await db.query(updateSettings, [user_id, subscription_autorenewal]);

    await db.query("COMMIT");

    if (paymentsResult.rowCount === 0 && settingsResult.rowCount === 0) return null;

    return {
      payment: paymentsResult.rows[0],
      setting: settingsResult.rows[0],
    };
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Error updating auto-renew:", err);
    throw err;
  } finally {
    db.release();
  }
};


