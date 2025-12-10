import express from "express";
import db from "../configs/db.js";

const router = express.Router();

// ADD TAG
router.post("/add", async (req, res) => {
  try {
    const { title, color } = req.body;
    const userId = req.session.user_id || 1;

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

// LIST TAGS
router.get("/list", async (req, res) => {
  try {
    const userId = req.session.user_id || 1;

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

// DELETE TAG
router.delete("/delete/:id", async (req, res) => {
  try {
    const tagId = parseInt(req.params.id, 10);
    const userId = req.session.user_id || 1;

    if (Number.isNaN(tagId)) {
      return res.status(400).json({ success: false, message: "Invalid tag ID" });
    }

    const result = await db.query(
      `DELETE FROM tags 
       WHERE tag_id = $1 AND user_id = $2
       RETURNING tag_id`,
      [tagId, userId]
    );

    if (!result.length) {
      return res.status(404).json({ success: false, message: "Tag not found" });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("❌ Error deleting tag:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET TAG BY ID
router.get("/:id", async (req, res) => {
  try {
    const tagId = parseInt(req.params.id, 10);
    const userId = req.session.user_id || 1;

    if (Number.isNaN(tagId)) {
      return res.status(400).json({ success: false, message: "Invalid tag ID" });
    }

    const result = await db.query(
      `SELECT tag_id, title, color 
       FROM tags 
       WHERE tag_id = $1 AND user_id = $2`,
      [tagId, userId]
    );

    if (!result.length) {
      return res.status(404).json({ success: false, message: "Tag not found" });
    }

    res.json({
      success: true,
      tag: result[0]
    });

  } catch (err) {
    console.error("❌ Error loading tag:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// UPDATE TAG
router.put("/:id", async (req, res) => {
  try {
    const tagId = parseInt(req.params.id, 10);
    const { title, color } = req.body;
    const userId = req.session.user_id || 1;

    if (Number.isNaN(tagId)) {
      return res.status(400).json({ success: false, message: "Invalid tag ID" });
    }

    if (!title || !color) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const result = await db.query(
      `UPDATE tags 
       SET title = $1, color = $2 
       WHERE tag_id = $3 AND user_id = $4
       RETURNING tag_id, title, color`,
      [title, color, tagId, userId]
    );

    if (!result.length) {
      return res.status(404).json({
        success: false,
        message: "Cannot update tag or tag not found"
      });
    }

    res.json({
      success: true,
      updatedTag: result[0]
    });

  } catch (err) {
    console.error("❌ Error updating tag:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
