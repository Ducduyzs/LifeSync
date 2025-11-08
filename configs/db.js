import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
});

// Kiểm tra kết nối khi server khởi động
(async () => {
  try {
    const client = await pool.connect();
    client.release();
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
  }
})();

const db = {
  async query(text, params) {
    const res = await pool.query(text, params);
    return res.rows;
  },
};

export default db;
export { pool };
