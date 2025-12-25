import express from "express";
import db from "../configs/db.js";

const router = express.Router();

/* add project chain */
router.post("/add", async (req, res) => {
  try {
    let { title, description, color, priority, start_time, end_time, tag_id } = req.body;
    const userId = req.session.user_id || 1;

    if (start_time && !start_time.includes("T")) {
      start_time = `${start_time}T09:00:00+07:00`;
    }
    if (end_time && !end_time.includes("T")) {
      end_time = `${end_time}T17:00:00+07:00`;
    }

    const createdAt = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh"
    });

    await db.query(
      `
      INSERT INTO project_chains (
        user_id, title, description, color,
        priority, start_time, end_time, tag_id,
        is_done, notify, calendar_sync, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,false,false,$9::timestamp)
      `,
      [userId, title, description, color, priority, start_time, end_time, tag_id, createdAt]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("error adding project chain:", err);
    res.status(500).json({ success: false });
  }
});

/* list project chains */
router.get("/list", async (req, res) => {
  try {
    const userId = req.session.user_id || 1;

    const rows = await db.query(
      `
      SELECT 
        c.chain_id, c.title, c.description, c.color, c.priority,
        c.start_time, c.end_time, c.created_at,
        tg.title AS tag_title, tg.color AS tag_color
      FROM project_chains c
      LEFT JOIN tags tg ON tg.tag_id = c.tag_id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
      `,
      [userId]
    );

    res.json({ success: true, chains: rows });
  } catch (err) {
    console.error("error listing project chains:", err);
    res.status(500).json({ success: false });
  }
});

/* get project detail with nodes */
router.get("/detail/:id", async (req, res) => {
  try {
    const chainId = parseInt(req.params.id, 10);
    const userId = req.session.user_id || 1;

    const rows = await db.query(
      `
      SELECT 
        c.*,
        tg.title AS tag_title,
        tg.color AS tag_color,

        COALESCE(
          json_agg(
            json_build_object(
              'node_id', n.node_id,
              'title', n.title,
              'note', n.note,
              'is_done', n.is_done,
              'order_index', n.order_index,
              'priority', n.priority,
              'tag_id', n.tag_id,
              'tag_title', nt.title,
              'parent_id', n.parent_id,
              'start_time', n.start_time,
              'end_time', n.end_time
            )
            ORDER BY n.order_index
          ) FILTER (WHERE n.node_id IS NOT NULL),
          '[]'
        ) AS nodes

      FROM project_chains c
      LEFT JOIN tags tg ON tg.tag_id = c.tag_id
      LEFT JOIN project_nodes n ON n.chain_id = c.chain_id
      LEFT JOIN tags nt ON nt.tag_id = n.tag_id

      WHERE c.chain_id = $1 AND c.user_id = $2

      GROUP BY c.chain_id, tg.title, tg.color
      `,
      [chainId, userId]
    );

    if (!rows.length) return res.json({ success: false });

    res.json({ success: true, project: rows[0] });
  } catch (err) {
    console.error("error fetching project detail:", err);
    res.status(500).json({ success: false });
  }
});

/* delete project chain */
router.delete("/delete/:id", async (req, res) => {
  try {
    const chainId = parseInt(req.params.id, 10);
    const userId = req.session.user_id || 1;

    await db.query("DELETE FROM project_nodes WHERE chain_id=$1", [chainId]);
    await db.query(
      "DELETE FROM project_chains WHERE chain_id=$1 AND user_id=$2",
      [chainId, userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("error deleting project chain:", err);
    res.status(500).json({ success: false });
  }
});

/* toggle node is_done */
router.post("/node/toggle/:id", async (req, res) => {
  try {
    const nodeId = parseInt(req.params.id, 10);
    const { is_done } = req.body;

    await db.query(
      "UPDATE project_nodes SET is_done=$1 WHERE node_id=$2",
      [is_done === true || is_done === "true", nodeId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("error toggling node:", err);
    res.status(500).json({ success: false });
  }
});

/* update node info */
router.post("/node/update/:id", async (req, res) => {
  try {
    const nodeId = parseInt(req.params.id, 10);

    let {
      title,
      note,
      priority,
      tag_id,
      taskStartDate,
      taskEndDate,
      taskStart,
      taskEnd
    } = req.body;

    let startTimeISO = null;
    let endTimeISO = null;

    if (taskStartDate) {
    const startHour = taskStart || "09:00";
    startTimeISO = `${taskStartDate}T${startHour}:00+07:00`;
    }

    if (taskEndDate) {
      const endHour = taskEnd || "17:00";
      endTimeISO = `${taskEndDate}T${endHour}:00+07:00`;
    }


    await db.query(
      `
      UPDATE project_nodes
      SET
        title = $1,
        note = $2,
        priority = $3,
        tag_id = $4,
        start_time = $5,
        end_time = $6
      WHERE node_id = $7
      `,
      [
        title,
        note || "",
        priority || null,
        tag_id || null,
        startTimeISO,
        endTimeISO,
        nodeId
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("error updating node:", err);
    res.status(500).json({ success: false });
  }
});



/* add project node */

router.post("/node/add/:chainId", async (req, res) => {
  try {
    const chainId = parseInt(req.params.chainId, 10);

    let {
      title,
      note,
      priority,
      tag_id,
      parent_id,
      taskStartDate,
      taskEndDate,
      taskStart,
      taskEnd
    } = req.body;

    let startTimeISO = null;
    let endTimeISO = null;

    if (taskStartDate) {
      const startHour = taskStart || "09:00";
      startTimeISO = `${taskStartDate}T${startHour}:00+07:00`;
    }

    if (taskEndDate) {
      const endHour = taskEnd || "17:00";
      endTimeISO = `${taskEndDate}T${endHour}:00+07:00`;
    }


    const next = await db.query(
      `
      SELECT COALESCE(MAX(order_index), -1) + 1 AS idx
      FROM project_nodes
      WHERE chain_id = $1
      `,
      [chainId]
    );

    await db.query(
      `
      INSERT INTO project_nodes (
        chain_id,
        title,
        note,
        order_index,
        is_done,
        priority,
        tag_id,
        parent_id,
        start_time,
        end_time
      )
      VALUES ($1,$2,$3,$4,false,$5,$6,$7,$8,$9)
      `,
      [
        chainId,
        title,
        note || "",
        next[0].idx,
        priority || null,
        tag_id || null,
        parent_id || null,
        startTimeISO,
        endTimeISO
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("error adding node:", err);
    res.status(500).json({ success: false });
  }
});



/* update project chain */
router.put("/update/:id", async (req, res) => {
  const id = req.params.id;
  const { title, description, priority, start_time, end_time, tag_id } = req.body;

  try {
    await db.query(
      `
      UPDATE project_chains 
      SET title=$1, description=$2, priority=$3,
          start_time=$4, end_time=$5, tag_id=$6
      WHERE chain_id=$7
      `,
      [title, description, priority, start_time, end_time, tag_id, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("error updating project:", err);
    res.json({ success: false });
  }
});

/* get node detail */
router.get("/node/:id", async (req, res) => {
  try {
    const rows = await db.query(
      `
      SELECT
        n.node_id, n.chain_id, n.parent_id, n.title, n.note,
        n.start_time, n.end_time, n.order_index,
        n.is_done, n.priority, n.tag_id, n.created_at,
        t.title AS tag_title
      FROM project_nodes n
      LEFT JOIN tags t ON n.tag_id = t.tag_id
      WHERE n.node_id = $1
      `,
      [req.params.id]
    );

    if (!rows.length) return res.json({ success: false });

    res.json({ success: true, node: rows[0] });
  } catch (err) {
    console.error("error fetching node detail:", err);
    res.status(500).json({ success: false });
  }
});

/* delete node */
router.delete("/node/delete/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM project_nodes WHERE node_id=$1", [
      parseInt(req.params.id, 10)
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error("error deleting node:", err);
    res.status(500).json({ success: false });
  }
});

export default router;
