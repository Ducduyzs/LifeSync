import express from "express";
import db from "../configs/db.js";

const router = express.Router();

// 🩷 Lưu tag mới vào bảng tags
router.post("/add", async (req, res) => {
  try {
    const { title, color } = req.body;

    // 🧩 Giả sử user đã đăng nhập
    const userId = req.session.user_id || 1; // nếu chưa có session thì gán tạm ID 1

    if (!title || !color) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    await db.query(
      `INSERT INTO tags (title, color, user_id)
       VALUES ($1, $2, $3)`,
      [title, color, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error adding tag:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.get("/list", async (req, res) => {
  try {
    const userId = req.session.user_id || 1; // tạm fix user id = 1
    const tags = await db.query(
      "SELECT tag_id, title, color FROM tags WHERE user_id = $1 ORDER BY tag_id DESC",
      [userId]
    );

    res.json({ success: true, tags });
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ success: false, message: "Failed to load tags" });
  }
});

// 🌸 API thêm tag (đã có)
router.post("/add", async (req, res) => {
  try {
    const { title, color } = req.body;
    const userId = req.session.user_id || 1;

    await db.query(
      "INSERT INTO tags (title, color, user_id) VALUES ($1, $2, $3)",
      [title, color, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error adding tag:", error);
    res.status(500).json({ success: false });
  }
});

export default router;
