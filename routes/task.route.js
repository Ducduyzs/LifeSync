import express from "express";
import db from "../configs/db.js";

const router = express.Router();

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
    res.status(500).json({ success: false, message: "Server error while adding task." });
  }
});


router.get("/list", async (req, res) => {
  try {
    const userId = req.session.user_id || 1;
    const date = req.query.date;
    const queryDate = date || new Date().toISOString().split("T")[0];

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
        AND DATE(t.start_time) = $2
      ORDER BY t.start_time ASC
      `,
      [userId, queryDate]
    );

    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching task list." });
  }
});





router.post("/toggle/:id", async (req, res) => {
  try {
    const taskId = req.params.id;
    const { is_done } = req.body;
    await db.query(`UPDATE tasks SET is_done = $1 WHERE task_id = $2`, [is_done, taskId]);
    res.json({ success: true, message: "Task updated successfully!" });
  } catch {
    res.status(500).json({ success: false, message: "Error updating task status." });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const taskId = req.params.id;
    await db.query(`DELETE FROM tasks WHERE task_id = $1`, [taskId]);
    res.json({ success: true, message: "Task deleted successfully!" });
  } catch {
    res.status(500).json({ success: false, message: "Error deleting task." });
  }
});

export default router;
