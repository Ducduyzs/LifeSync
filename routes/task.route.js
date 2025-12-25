import express from "express";
import db from "../configs/db.js";

const router = express.Router();

// Thêm task mới
router.post("/add", async (req, res) => {
  try {
    let { title, note, start_time, end_time, priority, tag_id } = req.body;
    const userId = req.session.user_id || 1;
    const createdAt = new Date();
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];

    if (start_time) start_time = `${dateStr}T${start_time}:00+07:00`;
    if (end_time) end_time = `${dateStr}T${end_time}:00+07:00`;

    await db.query(
      `
      INSERT INTO tasks (
        title, note, start_time, end_time, priority,
        is_done, tag_id, user_id, notify, calendar_sync, created_at
      )
      VALUES ($1, $2, $3, $4, $5, false, $6, $7, false, false, $8)
      `,
      [title, note, start_time, end_time, priority, tag_id, userId, createdAt]
    );

    res.json({ success: true, message: "Task added successfully!" });
  } catch (error) {
    console.error(" Error adding task:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while adding task." });
  }
});

// Lấy danh sách task (có sắp xếp)

router.get("/list", async (req, res) => {
  try {
    const userId = req.session.user_id || 1;

    const date = req.query.date || new Date().toISOString().split("T")[0];
    const sortBy = req.query.sort || "start";

    let orderBy = "t.start_time ASC";
    if (sortBy === "end") orderBy = "t.end_time ASC";
    if (sortBy === "tag") orderBy = "tg.title ASC NULLS LAST";
    if (sortBy === "done") orderBy = "t.is_done ASC";
    if (sortBy === "title") orderBy = "t.title ASC";

    const tasks = await db.query(
      `
      SELECT 
        t.task_id,
        t.title,
        t.note,
        t.start_time,
        t.end_time,
        t.priority,
        t.is_done,
        t.created_at,
        tg.title AS tag_title,
        tg.color AS tag_color
      FROM tasks t
      LEFT JOIN tags tg ON t.tag_id = tg.tag_id
      WHERE t.user_id = $1
        AND (
             DATE(t.start_time) = $2
          OR DATE(t.end_time) = $2
          OR (t.start_time <= $2::date AND t.end_time >= ($2::date + INTERVAL '1 day'))
        )
      ORDER BY ${orderBy}
      `,
      [userId, date]
    );

    res.json({ success: true, tasks });
  } catch (error) {
    console.error(" Error fetching task list:", error);
    res.status(500).json({ success: false, message: "Error fetching task list." });
  }
});


// Cập nhật trạng thái hoàn thành (checkbox)
router.post("/toggle/:id", async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (Number.isNaN(taskId)) {
      return res.status(400).json({ success: false, message: "Invalid task id" });
    }
    const { is_done } = req.body;
    const value = is_done === true || is_done === "true";

    await db.query(
      "UPDATE tasks SET is_done = $1 WHERE task_id = $2",
      [value, taskId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error(" Error toggling task:", error);
    res.status(500).json({ success: false, message: "Error updating task." });
  }
});

router.get("/detail/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.session.user_id || 1;

    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const rows = await db.query(
      `SELECT t.*, tg.title AS tag_title, tg.color AS tag_color
       FROM tasks t
       LEFT JOIN tags tg ON tg.tag_id = t.tag_id
       WHERE t.task_id = $1 AND t.user_id = $2`,
      [id, userId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    res.json({ success: true, task: rows[0] });

  } catch (err) {
    console.error(" Error loading task detail:", err);
    res.status(500).json({ success: false });
  }
});

// Xóa task
router.delete("/delete/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.session.user_id || 1;

    const rows = await db.query(
      "DELETE FROM tasks WHERE task_id = $1 AND user_id = $2 RETURNING task_id",
      [id, userId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.json({ success: true, message: "Task deleted successfully" });

  } catch (err) {
    console.error(" Error deleting task:", err);
    res.status(500).json({ success: false, message: "Server error while deleting task." });
  }
});

// Cập nhật task
// 🌸 Update Task
router.post("/update/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.session.user_id || 1;

    const { title, note, start_time, end_time, priority, tag_id, start_date, end_date } = req.body;

    const start = start_date && start_time ? `${start_date}T${start_time}:00+07:00` : null;
    const end = end_date && end_time ? `${end_date}T${end_time}:00+07:00` : null;

    await db.query(`
      UPDATE tasks
      SET title=$1, note=$2, start_time=$3, end_time=$4, priority=$5, tag_id=$6
      WHERE task_id=$7 AND user_id=$8
    `, [title, note, start, end, priority, tag_id || null, id, userId]);

    res.json({ success: true });

  } catch (err) {
    console.error("❌ Error updating task:", err);
    res.status(500).json({ success: false });
  }
});

export default router;
