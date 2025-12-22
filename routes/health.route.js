import express from "express";
import db from "../configs/db.js";
import { hfText } from "../configs/hfClient.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) return res.redirect("/auth/login");

    const userRows = await db.query(
      "SELECT full_name, height_cm, weight_kg, medical_conditions FROM users WHERE user_id = $1",
      [userId]
    );
    const user = userRows[0] || {};

    const todayRow = await db.query(
      `SELECT date, sleep_hours, steps, calories, water_intake, mood
       FROM health_logs
       WHERE user_id = $1 AND date = CURRENT_DATE
       LIMIT 1`,
      [userId]
    );
    const todayLog = todayRow[0] || null;

    const weeklyRows = await db.query(
      `SELECT date, sleep_hours, steps, calories, water_intake, mood
       FROM health_logs
       WHERE user_id = $1
         AND date >= CURRENT_DATE - INTERVAL '6 days'
       ORDER BY date ASC`,
      [userId]
    );

    try {
      const totalLogs = await db.query(`SELECT COUNT(*) AS cnt FROM health_logs WHERE user_id = $1`, [userId]);
      const totalAppointments = await db.query(`SELECT COUNT(*) AS cnt FROM health_appointments WHERE user_id = $1`, [userId]);
      console.debug(`Health debug: user ${userId} - totalLogs=${totalLogs[0].cnt}, weeklyRows=${weeklyRows.length}, totalAppointments=${totalAppointments[0].cnt}`);
    } catch (dbgErr) {
      console.debug('Health debug: error fetching counts', dbgErr.message);
    }

    let stats = {
      avg_sleep: null,
      avg_steps: null,
      avg_calories: null,
      avg_water: null,
      avg_mood: null,
    };

    if (weeklyRows.length > 0) {
      const n = weeklyRows.length;
      const sum = weeklyRows.reduce(
        (acc, r) => {
          acc.sleep += Number(r.sleep_hours || 0);
          acc.steps += Number(r.steps || 0);
          acc.cal += Number(r.calories || 0);
          acc.water += Number(r.water_intake || 0);
          acc.mood += Number(r.mood || 0);
          return acc;
        },
        { sleep: 0, steps: 0, cal: 0, water: 0, mood: 0 }
      );

      stats = {
        avg_sleep: (sum.sleep / n).toFixed(1),
        avg_steps: Math.round(sum.steps / n),
        avg_calories: Math.round(sum.cal / n),
        avg_water: (sum.water / n).toFixed(1),
        avg_mood: (sum.mood / n).toFixed(1),
      };
    }

    const weeklyLogs = weeklyRows.map((r) => ({
      ...r,
      displayDate: new Date(r.date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    }));

    const recentRows = await db.query(
      `SELECT date, sleep_hours, steps, calories, water_intake, mood
       FROM health_logs
       WHERE user_id = $1
       ORDER BY date DESC
       LIMIT 10`,
      [userId]
    );

    const recentLogs = recentRows.map((r) => ({
      ...r,
      displayDate: new Date(r.date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    }));

    const todayISO = new Date().toISOString().split("T")[0];

    res.render("health/dashboard", {
      pageTitle: "Health - LifeSync",
      user,
      todayLog,
      weeklyLogs,
      recentLogs,
      stats,
      todayISO,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading health dashboard");
  }
});

import { validateSaveLog, validateAppointment } from "../validators/health.js";
import { validateGoalPayload } from "../validators/goals.js";

router.post("/save-log", validateSaveLog, async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      return res.json({ success: false, message: "You are not logged in." });
    }

    let { date, sleep_hours, steps, calories, water_intake, mood, height_cm, weight_kg, medical_conditions } = req.body;
    const logDate = date || new Date().toISOString().split("T")[0];

    try {
      await db.query(
        `UPDATE users SET height_cm = $1, weight_kg = $2, medical_conditions = $3 WHERE user_id = $4`,
        [height_cm || null, weight_kg || null, medical_conditions || null, userId]
      );
    } catch (err) {
      console.warn('Could not update user profile fields:', err.message);
    }

    await db.query(
      `INSERT INTO health_logs
       (user_id, date, sleep_hours, steps, calories, water_intake, mood)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (user_id, date)
       DO UPDATE SET
         sleep_hours = EXCLUDED.sleep_hours,
         steps = EXCLUDED.steps,
         calories = EXCLUDED.calories,
         water_intake = EXCLUDED.water_intake,
         mood = EXCLUDED.mood`,
      [
        userId,
        logDate,
        req.body.sleep_hours || null,
        req.body.steps || null,
        req.body.calories || null,
        req.body.water_intake || null,
        req.body.mood || null,
      ]
    );

    res.json({ success: true, message: "Health log saved successfully." });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: "Error saving health log.",
    });
  }
});

router.post('/appointments/add', validateAppointment, async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      return res.json({ success: false, message: "You are not logged in." });
    }

    const { appointment_date, appointment_time, reason, medical_condition, notes } = req.body;

    await db.query(
      `INSERT INTO health_appointments 
       (user_id, appointment_date, appointment_time, reason, medical_condition, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, appointment_date, appointment_time || null, reason, medical_condition || null, notes || null]
    );

    res.json({ success: true, message: "Appointment added successfully." });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error adding appointment." });
  }
});

router.post('/appointments/update/:id', validateAppointment, async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      return res.json({ success: false, message: "You are not logged in." });
    }

    const { id } = req.params;
    const { appointment_date, appointment_time, reason, medical_condition, notes, status } = req.body;

    await db.query(
      `UPDATE health_appointments 
       SET appointment_date = $1, appointment_time = $2, reason = $3, 
           medical_condition = $4, notes = $5, status = $6, updated_at = NOW()
       WHERE id = $7 AND user_id = $8`,
      [appointment_date, appointment_time || null, reason, medical_condition || null, notes || null, status, id, userId]
    );

    res.json({ success: true, message: "Appointment updated successfully." });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error updating appointment." });
  }
});

router.post("/ai/calories", async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.session.user_id;
    let profileText = "";
    if (userId) {
      const pRows = await db.query(
        "SELECT height_cm, weight_kg, medical_conditions FROM users WHERE user_id=$1",
        [userId]
      );
      const p = pRows[0] || {};
      const parts = [];
      if (p.height_cm) parts.push(`Height: ${p.height_cm} cm`);
      if (p.weight_kg) parts.push(`Weight: ${p.weight_kg} kg`);
      if (p.medical_conditions) parts.push(`Medical conditions: ${p.medical_conditions}`);
      if (parts.length) profileText = `User Profile: ${parts.join("; ")}.\n\n`;
    }

    const prompt = `
You are a certified nutrition expert.
The user describes their meal as follows: "${text}".

Please provide in plain text numbered format without markdown:
1. Total estimated calories
2. Breakdown of calories by main components (if identifiable)
3. Brief assessment of whether this portion is light, moderate, or heavy for an average adult

Respond clearly and concisely, without using asterisks, hashtags, dashes or markdown syntax.`;
    const answer = await hfText(profileText + prompt, { maxTokens: 8192 });
    res.json({ success: true, answer });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      answer: "Unable to calculate calories at this moment.",
    });
  }
});

router.post("/ai/meal", async (req, res) => {
  try {
    const { goal, condition } = req.body;
    const userId = req.session.user_id;
    let profileText = "";
    if (userId) {
      const pRows = await db.query(
        "SELECT height_cm, weight_kg, medical_conditions FROM users WHERE user_id=$1",
        [userId]
      );
      const p = pRows[0] || {};
      const parts = [];
      if (p.height_cm) parts.push(`Height: ${p.height_cm} cm`);
      if (p.weight_kg) parts.push(`Weight: ${p.weight_kg} kg`);
      if (p.medical_conditions) parts.push(`Medical conditions: ${p.medical_conditions}`);
      if (parts.length) profileText = `User Profile: ${parts.join("; ")}.\n\n`;
    }

    const prompt = `
You are a personal nutrition specialist.
User's goal: ${goal}.
Current health status: ${condition || "not specified"}.

Please suggest a 1-day meal plan in plain text numbered format without markdown:
1. Breakfast - suggest specific dishes and explain why they suit the goal and health status
2. Lunch - suggest specific dishes and explain why they suit the goal and health status
3. Dinner - suggest specific dishes and explain why they suit the goal and health status
4. Snacks (1-2) - suggest snacks and explain why they suit the goal and health status

Prefer common, locally available foods.
Respond without using asterisks, hashtags, dashes or markdown syntax.`;
    const answer = await hfText(profileText + prompt, { maxTokens: 8192 });
    res.json({ success: true, answer });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      answer: "Unable to suggest a meal plan at this moment.",
    });
  }
});

router.post("/ai/symptom", async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.session.user_id;
    let profileText = "";
    if (userId) {
      const pRows = await db.query(
        "SELECT height_cm, weight_kg, medical_conditions FROM users WHERE user_id=$1",
        [userId]
      );
      const p = pRows[0] || {};
      const parts = [];
      if (p.height_cm) parts.push(`Height: ${p.height_cm} cm`);
      if (p.weight_kg) parts.push(`Weight: ${p.weight_kg} kg`);
      if (p.medical_conditions) parts.push(`Medical conditions: ${p.medical_conditions}`);
      if (parts.length) profileText = `User Profile: ${parts.join("; ")}.\n\n`;
    }

    const prompt = `
You are a health assistant.
The user describes their symptoms: "${text}".

Please respond in plain text numbered format without markdown:
1. Possible causes (explained simply without overly technical terms)
2. Severity level (low, moderate, or high)
3. When to seek immediate medical attention
4. Safe home care suggestions (temporary measures only)

Important: Do not make definitive diagnoses. Always remind the user to see a healthcare provider if symptoms worsen or persist.
Respond clearly without using asterisks, hashtags, dashes or markdown syntax.`;
    const answer = await hfText(profileText + prompt, { maxTokens: 8192 });
    res.json({ success: true, answer });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      answer: "Unable to analyze symptoms at this moment.",
    });
  }
});

router.get("/weekly-advice", async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      return res.json({
        success: false,
        answer: "You are not logged in.",
      });
    }

    const rows = await db.query(
      `SELECT date, sleep_hours, steps, calories, water_intake, mood
       FROM health_logs
       WHERE user_id = $1
         AND date >= CURRENT_DATE - INTERVAL '6 days'
       ORDER BY date ASC`,
      [userId]
    );

    if (rows.length === 0) {
      return res.json({
        success: false,
        answer: "Insufficient health data for the last 7 days to provide analysis.",
      });
    }

    const summaryLines = rows
      .map((r) => {
        const d = new Date(r.date).toISOString().split("T")[0];
        return `${d}: sleep ${r.sleep_hours || 0}h, steps ${r.steps || 0}, calories ${r.calories || 0}, water ${
          r.water_intake || 0
        }L, mood ${r.mood || 0}/5`;
      })
      .join("\n");

    let profileText = "";
    if (userId) {
      const pRows = await db.query(
        "SELECT height_cm, weight_kg, medical_conditions FROM users WHERE user_id=$1",
        [userId]
      );
      const p = pRows[0] || {};
      const parts = [];
      if (p.height_cm) parts.push(`Height: ${p.height_cm} cm`);
      if (p.weight_kg) parts.push(`Weight: ${p.weight_kg} kg`);
      if (p.medical_conditions) parts.push(`Medical conditions: ${p.medical_conditions}`);
      if (parts.length) profileText = `User Profile: ${parts.join("; ")}.\n\n`;
    }

    const prompt = `
Below is a user's health data from the last 7 days:

${summaryLines}

Please provide in plain text numbered format without markdown:
1. Overall assessment of sleep quality, physical activity, nutrition, water intake, and mood
2. Identify unhealthy habits that need improvement
3. Suggest a concrete 7-day action plan with 3-5 specific, immediately actionable recommendations
4. Remind the user to consult a healthcare provider if they notice unusual or persistent symptoms

Respond clearly without using asterisks, hashtags, dashes or markdown syntax.`;
    const answer = await hfText(profileText + prompt, { maxTokens: 8192 });
    res.json({ success: true, answer });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      answer: "Unable to analyze 7-day data at this moment.",
    });
  }
});

router.get("/profile", async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) return res.redirect("/auth/login");

    const userRows = await db.query(
      "SELECT user_id, full_name, height_cm, weight_kg, medical_conditions FROM users WHERE user_id = $1",
      [userId]
    );
    const user = userRows[0] || {};

    const historyRows = await db.query(
      `SELECT * FROM user_health_profile_history 
       WHERE user_id = $1 
       ORDER BY created_at DESC LIMIT 12`,
      [userId]
    ).catch(() => []);

    res.render("health/profile", {
      pageTitle: "Health Profile - LifeSync",
      user,
      history: historyRows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading profile");
  }
});

router.post("/profile/update", async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      return res.json({ success: false, message: "You are not logged in." });
    }

    const { height_cm, weight_kg, medical_conditions } = req.body;

    await db.query(
      `UPDATE users SET height_cm = $1, weight_kg = $2, medical_conditions = $3 WHERE user_id = $4`,
      [height_cm || null, weight_kg || null, medical_conditions || null, userId]
    );

    try {
      await db.query(
        `INSERT INTO user_health_profile_history (user_id, height_cm, weight_kg, medical_conditions)
         VALUES ($1, $2, $3, $4)`,
        [userId, height_cm || null, weight_kg || null, medical_conditions || null]
      );
    } catch (err) {
      console.warn("Could not insert history:", err.message);
    }

    res.json({ success: true, message: "Health profile updated successfully." });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: "Error updating health profile.",
    });
  }
});

router.get("/appointments", async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) return res.redirect("/auth/login");

    const appointments = await db.query(
      `SELECT id, appointment_date, appointment_time, reason, medical_condition, notes, status
       FROM health_appointments
       WHERE user_id = $1 AND appointment_date >= CURRENT_DATE
       ORDER BY appointment_date ASC, appointment_time ASC`,
      [userId]
    );

    res.json({ success: true, appointments });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error fetching appointments." });
  }
});

router.get('/debug', async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) return res.json({ success: false, message: 'You are not logged in.' });

    const counts = await db.query(`SELECT COUNT(*) AS cnt FROM health_logs WHERE user_id = $1`, [userId]);
    const appointmentsCount = await db.query(`SELECT COUNT(*) AS cnt FROM health_appointments WHERE user_id = $1`, [userId]);
    const recentLogs = await db.query(`SELECT date, sleep_hours, steps, calories, water_intake, mood FROM health_logs WHERE user_id = $1 ORDER BY date DESC LIMIT 10`, [userId]);
    const recentAppointments = await db.query(`SELECT id, appointment_date, appointment_time, reason, status FROM health_appointments WHERE user_id = $1 ORDER BY appointment_date DESC LIMIT 10`, [userId]);

    return res.json({ success: true, counts: { logs: counts[0].cnt, appointments: appointmentsCount[0].cnt }, recentLogs, recentAppointments });
  } catch (err) {
    console.error('Debug endpoint error:', err);
    return res.json({ success: false, message: 'Error fetching debug info.' });
  }
});


async function computeGoalProgress(userId, goal) {
  if (!userId || !goal) return { progress: 0, achieved: false, streak: 0 };

  let value = 0;
  if (goal.period === 'daily') {
    const row = await db.query(`SELECT SUM(COALESCE(${goal.goal_type === 'steps' ? 'steps' : goal.goal_type === 'calories' ? 'calories' : goal.goal_type === 'water' ? 'water_intake' : 'sleep_hours'},0)) AS val FROM health_logs WHERE user_id = $1 AND date = CURRENT_DATE`, [userId]);
    value = Number(row[0].val) || 0;
  } else {
    if (goal.goal_type === 'sleep') {
      const row = await db.query(`SELECT AVG(COALESCE(sleep_hours,0)) AS val FROM health_logs WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '6 days'`, [userId]);
      value = Number(row[0].val) || 0;
    } else {
      const col = goal.goal_type === 'steps' ? 'steps' : goal.goal_type === 'calories' ? 'calories' : 'water_intake';
      const row = await db.query(`SELECT SUM(COALESCE(${col},0)) AS val FROM health_logs WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '6 days'`, [userId]);
      value = Number(row[0].val) || 0;
    }
  }

  const progress = Math.min(100, Math.round((value / Number(goal.target)) * 100));

  let streak = 0;
  try {
    const streakQuery = `
      SELECT date, ${goal.goal_type === 'sleep' ? 'sleep_hours' : goal.goal_type === 'steps' ? 'steps' : goal.goal_type === 'calories' ? 'calories' : 'water_intake'} as val
      FROM health_logs
      WHERE user_id = $1 AND date <= CURRENT_DATE
      ORDER BY date DESC
      LIMIT 30`;
    const rows = await db.query(streakQuery, [userId]);
    for (const r of rows) {
      const val = Number(r.val || 0);
      if (goal.goal_type === 'sleep') {
        if (val >= Number(goal.target)) streak++; else break;
      } else {
        if (val >= Number(goal.target)) streak++; else break;
      }
    }
  } catch (sErr) {
    console.debug('Streak calc error', sErr.message);
  }

  return { progress, value, achieved: value >= Number(goal.target), streak };
}

router.get('/goals', async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) return res.json({ success: false, message: 'You are not logged in.' });
    const goals = await db.query(`SELECT id, goal_type, target, period, created_at FROM health_goals WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    const out = [];
    for (const g of goals) {
      const stats = await computeGoalProgress(userId, g);
      out.push({ ...g, ...stats });
    }
    res.json({ success: true, goals: out });
  } catch (err) {
    console.error('Error fetching goals:', err);
    res.json({ success: false, message: 'Error fetching goals.' });
  }
});

router.post('/goals', validateGoalPayload, async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) return res.json({ success: false, message: 'You are not logged in.' });
    const { goal_type, target, period } = req.body;

    await db.query(`INSERT INTO health_goals (user_id, goal_type, target, period) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id, goal_type, period) DO UPDATE SET target = EXCLUDED.target, created_at = NOW()`, [userId, goal_type, target, period]);
    res.json({ success: true, message: 'Goal saved.' });
  } catch (err) {
    console.error('Error saving goal:', err);
    res.json({ success: false, message: 'Error saving goal.' });
  }
});

router.delete('/goals/:id', async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) return res.json({ success: false, message: 'You are not logged in.' });
    const { id } = req.params;
    await db.query(`DELETE FROM health_goals WHERE id = $1 AND user_id = $2`, [id, userId]);
    res.json({ success: true, message: 'Goal removed.' });
  } catch (err) {
    console.error('Error deleting goal:', err);
    res.json({ success: false, message: 'Error deleting goal.' });
  }
});

router.get("/appointments/:id", async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      return res.json({ success: false, message: "You are not logged in." });
    }

    const { id } = req.params;
    const result = await db.query(
      `SELECT id, appointment_date, appointment_time, reason, medical_condition, notes, status
       FROM health_appointments
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.length === 0) {
      return res.json({ success: false, message: "Appointment not found." });
    }

    res.json({ success: true, appointment: result[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error fetching appointment." });
  }
});

router.post("/appointments/add", async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      return res.json({ success: false, message: "You are not logged in." });
    }

    const { appointment_date, appointment_time, reason, medical_condition, notes } = req.body;

    await db.query(
      `INSERT INTO health_appointments 
       (user_id, appointment_date, appointment_time, reason, medical_condition, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, appointment_date, appointment_time || null, reason, medical_condition || null, notes || null]
    );

    res.json({ success: true, message: "Appointment added successfully." });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error adding appointment." });
  }
});

router.post("/appointments/update/:id", async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      return res.json({ success: false, message: "You are not logged in." });
    }

    const { id } = req.params;
    const { appointment_date, appointment_time, reason, medical_condition, notes, status } = req.body;

    await db.query(
      `UPDATE health_appointments 
       SET appointment_date = $1, appointment_time = $2, reason = $3, 
           medical_condition = $4, notes = $5, status = $6, updated_at = NOW()
       WHERE id = $7 AND user_id = $8`,
      [appointment_date, appointment_time || null, reason, medical_condition || null, notes || null, status, id, userId]
    );

    res.json({ success: true, message: "Appointment updated successfully." });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error updating appointment." });
  }
});

router.delete("/appointments/:id", async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      return res.json({ success: false, message: "You are not logged in." });
    }

    const { id } = req.params;

    await db.query(
      `DELETE FROM health_appointments WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    res.json({ success: true, message: "Appointment deleted successfully." });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error deleting appointment." });
  }
});

router.get("/charts/weight-bmi", async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) return res.redirect("/auth/login");

    const data = await db.query(
      `SELECT created_at as date, weight_kg, height_cm
       FROM user_health_profile_history
       WHERE user_id = $1
       ORDER BY created_at ASC
       LIMIT 30`,
      [userId]
    );

    const chartData = data.map(row => {
      const bmi = row.height_cm ? (row.weight_kg / ((row.height_cm / 100) ** 2)).toFixed(1) : null;
      return {
        date: new Date(row.date).toLocaleDateString("en-US"),
        weight: parseFloat(row.weight_kg),
        bmi: bmi ? parseFloat(bmi) : null
      };
    });

    res.json({ success: true, data: chartData });
  } catch (err) {
    console.error(err);
    res.json({ success: false, data: [] });
  }
});

router.get("/charts/health-metrics", async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) return res.redirect("/auth/login");

    const data = await db.query(
      `SELECT date, sleep_hours, steps, calories, water_intake, mood
       FROM health_logs
       WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY date ASC`,
      [userId]
    );

    const chartData = data.map(row => ({
      date: new Date(row.date).toLocaleDateString("en-US"),
      sleep: parseFloat(row.sleep_hours) || 0,
      steps: parseInt(row.steps) || 0,
      calories: parseInt(row.calories) || 0,
      water: parseFloat(row.water_intake) || 0,
      mood: parseInt(row.mood) || 0
    }));

    res.json({ success: true, data: chartData });
  } catch (err) {
    console.error(err);
    res.json({ success: false, data: [] });
  }
});

router.get("/health-status-today", async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) return res.redirect("/auth/login");

    const todayLog = await db.query(
      `SELECT sleep_hours, steps, calories, water_intake, mood FROM health_logs
       WHERE user_id = $1 AND date = CURRENT_DATE`,
      [userId]
    );

    const user = await db.query(
      `SELECT height_cm, weight_kg, medical_conditions FROM users WHERE user_id = $1`,
      [userId]
    );

    const yesterday = await db.query(
      `SELECT sleep_hours, steps, calories, water_intake, mood FROM health_logs
       WHERE user_id = $1 AND date = CURRENT_DATE - INTERVAL '1 day'`,
      [userId]
    );

    const today = todayLog[0] || {};
    const userProfile = user[0] || {};
    const yesterdayLog = yesterday[0] || {};

    let bmi = null;
    if (userProfile.height_cm && userProfile.weight_kg) {
      bmi = (userProfile.weight_kg / ((userProfile.height_cm / 100) ** 2)).toFixed(1);
    }

    const comparison = {
      sleep: today.sleep_hours && yesterdayLog.sleep_hours 
        ? today.sleep_hours > yesterdayLog.sleep_hours ? "improved" : "declined"
        : "no_data",
      steps: today.steps && yesterdayLog.steps 
        ? today.steps > yesterdayLog.steps ? "improved" : "declined"
        : "no_data",
      calories: today.calories && yesterdayLog.calories 
        ? today.calories > yesterdayLog.calories ? "increased" : "decreased"
        : "no_data",
      water: today.water_intake && yesterdayLog.water_intake 
        ? today.water_intake > yesterdayLog.water_intake ? "improved" : "declined"
        : "no_data",
      mood: today.mood && yesterdayLog.mood 
        ? today.mood > yesterdayLog.mood ? "improved" : "declined"
        : "no_data"
    };

    res.json({
      success: true,
      today,
      userProfile,
      bmi,
      comparison,
      hasData: Object.keys(today).length > 0
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error fetching health status." });
  }
});

export default router;
