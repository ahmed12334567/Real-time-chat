import { pool } from "../config/db.js";
import type { member, message } from "../interface/chat.interface.js"

const chat = {
    createGroupChat: async (name: string) => {
        const query = `INSERT INTO chats(name, type)
        VALUES($1,'Group')
        RETURNING *`
        const value = [name]
        const result = await pool.query(query, value)
        return result.rows[0]
    },
    createPrivetChat: async () => {
        const query = `INSERT INTO chats(type)
        VALUES('Private')
        RETURNING *`
        const result = await pool.query(query)
        return result.rows[0]
    },
    addMemberToChat: async (data: member) => {
        const query = `
        INSERT INTO chat_members(chat_id, user_id, role)
        VALUES($1, $2, $3)
        RETURNING *`
        const values = [data.chatId, data.userId, data.role]
        const result = await pool.query(query, values);
        return result.rows[0];
    },
    createMessage: async (data: message) => {
        const query = `INSERT INTO messages(chat_id, sender_id, status, content)
        VALUES($1, $2, $3, $4)
        RETURNING *`
        const values = [data.chatId, data.senderId, data.status || "Sent", data.content]
        const result = await pool.query(query, values)
        return result.rows[0]
    },
    getUsername: async (data: any) => {
        const query = `SELECT username FROM users
        JOIN chat_members ON users.id = chat_members.user_id
        WHERE chat_id = $1 AND user_id <> $2`
        const values = [data.chatId, data.userId]
        const result = await pool.query(query, values)
        return result.rows[0]
    },
    checkPrivetChat: async (data: any) => {
        const query = `
                    SELECT c.id, c.type, c.created_at
                    FROM chats c
                    JOIN chat_members cm1 ON c.id = cm1.chat_id
                    JOIN chat_members cm2 ON c.id = cm2.chat_id
                    WHERE c.type = 'Private'
                    AND cm1.user_id = $1
                     AND cm2.user_id = $2
                    LIMIT 1;
    `;
        const values = [data.userId, data.senderId]
        const result = await pool.query(query, values)
        return result.rows[0]
    },
    isUserInChat: async (data: any) => {
        const query = `SELECT 1 
                        FROM chat_members 
                        WHERE chat_id = $1 AND user_id = $2
                        LIMIT 1;`
        const values = [data.chatId, data.userId]
        const result = await pool.query(query, values)
        return result.rowCount ? result.rowCount > 0 : false
    }
}

export default chat