import { pool } from "../config/db.js";
import type { member, message } from "../interface/chat.interface.js"
import type { PoolClient } from 'pg'

const chat = {
    createGroupChat: async (client: PoolClient, name: string) => {
        const query = `INSERT INTO chats(name, type)
        VALUES($1,'Group')
        RETURNING *`
        const value = [name]
        const result = await client.query(query, value)
        return result.rows[0]
    },
    createPrivetChat: async (client: PoolClient) => {
        const query = `INSERT INTO chats(type)
        VALUES('Private')
        RETURNING *`
        const result = await client.query(query)
        return result.rows[0]
    },
    addMemberToChat: async (client: PoolClient, data: member) => {
        const query = `
        INSERT INTO chat_members(chat_id, user_id, role, is_active)
        VALUES($1, $2, $3, true)
        ON CONFLICT (chat_id, user_id)
        DO UPDATE SET 
            is_active = true,
            left_at = null,
            removed_by = NULL,
            join_at = NOW(),
            role = EXCLUDED.role
        RETURNING *`
        const values = [data.chatId, data.userId, data.role]
        const result = await client.query(query, values);
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
    getMessage: async (messageId: string, chatId: string) => {
        const query = `SELECT * FROM messages 
        WHERE id = $1 AND chat_id = $2 AND deleted_at IS NULL`
        const values = [messageId, chatId]
        const result = await pool.query(query, values)
        return result.rows[0]
    },
    getUsername: async (data: any) => {
        const query = `SELECT username FROM users
        JOIN chat_members ON users.id = chat_members.user_id
        WHERE chat_id = $1 AND user_id != $2`
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
    checkGroupChat: async (client: PoolClient, chatId: string, memberId: string) => {
        const query = `SELECT * FROM chat_members
        WHERE chat_id = $1 AND user_id = $2
        AND is_active = true`
        const values = [chatId, memberId]
        const result = await client.query(query, values)
        return result.rows[0]
    },
    isUserInChat: async (data: any) => {
        const query = `SELECT 1 
                        FROM chat_members 
                        WHERE chat_id = $1 AND user_id = $2
                        AND is_active = true
                        LIMIT 1;`
        const values = [data.chatId, data.userId]
        const result = await pool.query(query, values)
        return result.rowCount ? result.rowCount > 0 : false
    },
    getChatMessages: async (chatId: string) => {
        const query = `SELECT 
                        m.id,
                        m.chat_id AS "chatId",
                        m.sender_id AS "senderId",
                        m.content,
                        m.status,
                        m.created_at AS "createdAt"
                        FROM messages m
                        WHERE m.chat_id = $1 AND deleted_at IS NULL
                        ORDER BY m.created_at ASC`
        const value = [chatId]
        const result = await pool.query(query, value)
        return result.rows
    },
    markMessagesAsRead: async (chatId: string, senderId: string) => {
        const query = `UPDATE messages 
                        SET status = 'Read'
                        WHERE chat_id = $1
                        AND sender_id = $2
                        AND status != 'Read'
                        AND deleted_at IS NULL
                        RETURNING id, chat_id, sender_id, status;`
        const values = [chatId, senderId]
        const result = await pool.query(query, values)
        return result.rows
    },
    updateMessage: async (content: string, messageId: string, chatId: string) => {
        const query = `UPDATE messages
        SET content = $1
        WHERE id = $2 AND chat_id = $3 AND deleted_at IS NULL
        RETURNING *;`
        const values = [content, messageId, chatId]
        const result = await pool.query(query, values)
        return result.rows[0] || null
    },
    deleteMessage: async (messageId: string, chatId: string) => {
        const query = `UPDATE messages
                        SET deleted_at = CURRENT_TIMESTAMP
                        WHERE id = $1 AND chat_id = $2
                        RETURNING id, deleted_at;
    `
        const values = [messageId, chatId]
        const result = await pool.query(query, values)

        return result.rows[0] || null
    },
    getUserChatIds: async (userId: string) => {
        const query = `SELECT chat_id FROM chat_members 
        WHERE user_id = $1`
        const value = [userId]
        const result = await pool.query(query, value)
        return result.rows.map((row) => row.chat_id)
    },
    updateLastSeen: async (userId: string, lastSeen: Date) => {
        const query = `UPDATE users 
        SET last_seen = $2 
        WHERE id = $1`
        const values = [userId, lastSeen]
        const result = await pool.query(query, values)
        return result.rowCount ? result.rowCount > 0 : false
    },
    getChatsUser: async (userId: string) => {
        const query = `SELECT chat_id, role, type, join_at
        FROM chat_members 
        JOIN chats ON chat_id = chats.id
        WHERE user_id = $1 
        AND is_active = true`
        const value = [userId]
        const result = await pool.query(query, value)
        return result.rows
    },
    getChatMembers: async (chatId: any, userId: string) => {
        const query = `SELECT chat_id, user_id, username, role, join_at
        FROM chat_members 
        JOIN users ON user_id = users.id
        WHERE chat_id = ANY($1::uuid[]) AND user_id <> $2
        AND is_active = true`
        const values = [chatId, userId]
        const result = await pool.query(query, values)
        return result.rows
    },
    getAdminMembership: async (userId: string, chatId: string): Promise<member | undefined> => {
        const query = `SELECT 1 FROM chat_members
        JOIN chats ON chat_id = chats.id 
        WHERE user_id = $1 AND chat_id = $2
        AND type = 'Group' AND role = 'admin'`
        const values = [userId, chatId]
        const result = await pool.query(query, values)
        return result.rows[0]
    },
    removeMemberChat: async (
        client: PoolClient,
        chatId: string,
        targetUserId: string,
        removedBy?: string | null
    ) => {
        const query = `UPDATE chat_members
        SET is_active = false, left_at = CURRENT_TIMESTAMP,
        removed_by = $3
        WHERE chat_id = $1 AND user_id = $2
        RETURNING left_at`
        const values = [chatId, targetUserId, removedBy]
        const result = await client.query(query, values)
        return result.rows[0]
    },
    changeRole: async (chatId: string, memberId: string, role: string) => {
        const query = `UPDATE chat_members
        SET role = $3 
        WHERE chat_id = $1 AND user_id = $2
        RETURNING *`
        const values = [chatId, memberId, role]
        const result = await pool.query(query, values)
        return result.rows[0]
    }
}

export default chat