import express from "express";
import db from "../configs/db.js";

const router = express.Router();

// Middleware kiểm tra đăng nhập
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user_id) {
    return res.redirect("/auth/login");
  }
  next();
}

// 🩷 Dashboard chính
router.get("/", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user_id;

    // 🧠 Lấy tên người dùng
    const userResult = await db.query("SELECT full_name FROM users WHERE user_id = $1", [userId]);
    const user = userResult[0] || { full_name: "User" };

    // 🗓️ Tính khung giờ trong ngày hôm nay
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // ✅ Lấy danh sách Task hôm nay
    const tasks = await db.query(
      `
      SELECT t.*, tg.title AS tag_title, tg.color AS tag_color
      FROM tasks t
      LEFT JOIN tags tg ON tg.tag_id = t.tag_id
      WHERE t.user_id = $1
        AND (t.start_time BETWEEN $2 AND $3 OR t.start_time IS NULL)
      ORDER BY t.start_time ASC, t.created_at DESC
      `,
      [userId, startOfDay, endOfDay]
    );

    // 🌿 Lấy danh sách Project Chains + Nodes
    const chains = await db.query(
      `
      SELECT c.*,
        COALESCE(
          json_agg(
            json_build_object(
              'node_id', n.node_id,
              'title', n.title,
              'is_done', n.is_done,
              'order_index', n.order_index
            )
            ORDER BY n.order_index
          ) FILTER (WHERE n.node_id IS NOT NULL),
          '[]'
        ) AS nodes
      FROM project_chains c
      LEFT JOIN project_nodes n ON n.chain_id = c.chain_id
      WHERE c.user_id = $1
      GROUP BY c.chain_id
      ORDER BY c.created_at DESC
      `,
      [userId]
    );

    // 📅 Ngày hiển thị
    const formattedDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // 🩷 Render trang Dashboard
    res.render("myday/dashboard", {
      pageTitle: "My Day - LifeSync",
      user,
      tasks,
      chains,
      currentDate: formattedDate,
    });
  } catch (err) {
    console.error("❌ Error loading dashboard:", err);
    res.status(500).render("error", {
      layout: false,
      message: "Error loading dashboard",
    });
  }
});

export default router;
