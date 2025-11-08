import express from "express";
import db from "../configs/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) return res.redirect("/auth/login");

    const user = await db.query("SELECT full_name FROM users WHERE user_id=$1", [userId]);

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const tasks = await db.query(
      `SELECT t.*, tg.title AS tag_title
       FROM tasks t
       LEFT JOIN tags tg ON tg.tag_id = t.tag_id
       WHERE t.user_id=$1 AND t.start_time BETWEEN $2 AND $3
       ORDER BY t.start_time ASC`,
      [userId, startOfDay, endOfDay]
    );

    res.render("myday/dashboard", {
      pageTitle: "My Day - LifeSync",
      user: user[0],
      tasks,
      currentDate: new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading dashboard");
  }
});

export default router;
