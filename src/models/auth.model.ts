import { pool } from "../config/db.js";
import type { User } from "../interface/user.interface.js";

const user = {
    createUser: async (data: User) => {
        const query = `INSERT INTO users(username, email, password)
        VALUES($1, $2, $3)
        RETURNING *`
        const values = [data.username, data.email, data.password]
        const result = await pool.query(query, values)
        return result.rows[0]
    },
    getUserByEmail: async (email: string) => {
        const query = `SELECT * FROM users
        WHERE email = $1`
        const value = [email]
        const result = await pool.query(query, value)
        return result.rows[0]
    }
}

export default user