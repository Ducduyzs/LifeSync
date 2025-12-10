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

    const todayISO = new Date().toISOString().split("T")[0];

    res.render("health/dashboard", {
      pageTitle: "Health - LifeSync",
      user,
      todayLog,
      weeklyLogs,
      stats,
      todayISO,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading health dashboard");
  }
});

router.post("/save-log", async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      return res.json({ success: false, message: "You are not logged in." });
    }

    let { date, sleep_hours, steps, calories, water_intake, mood, height_cm, weight_kg, medical_conditions } = req.body;
    const logDate = date || new Date().toISOString().split("T")[0];

    // Try to persist profile info to users table (if columns exist)
    try {
      await db.query(
        `UPDATE users SET height_cm = $1, weight_kg = $2, medical_conditions = $3 WHERE user_id = $4`,
        [height_cm || null, weight_kg || null, medical_conditions || null, userId]
      );
    } catch (err) {
      // If DB doesn't have these columns, ignore but log
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
        sleep_hours || null,
        steps || null,
        calories || null,
        water_intake || null,
        mood || null,
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

Please provide:
1) Total estimated calories.
2) Breakdown of calories by main components (if identifiable).
3) Brief assessment of whether this portion is light, moderate, or heavy for an average adult.

Respond in English, concisely and clearly.`;
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

Please suggest a 1-day meal plan including:
- Breakfast
- Lunch
- Dinner
- 1-2 snacks

For each meal:
- Suggest specific dishes.
- Explain why each meal is suitable for the goal and health status.
Prefer common, locally available foods.
Respond in English with clear bullet points and organized formatting.`;
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

Please respond with the following structure:
1) Possible causes (explained simply without overly technical terms).
2) Severity level (low, moderate, high).
3) When to seek immediate medical attention.
4) Safe home care suggestions (temporary measures only).

Important: Do not make definitive diagnoses. Always remind the user to see a healthcare provider if symptoms worsen or persist.
Respond in English, clearly and comprehensibly.`;
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

Please provide:
1) Overall assessment of sleep quality, physical activity, nutrition, water intake, and mood.
2) Identify unhealthy habits that need improvement.
3) Suggest a concrete 7-day action plan (3-5 specific, immediately actionable recommendations).
4) Remind the user to consult a healthcare provider if they notice unusual or persistent symptoms.

Respond in English, clearly and accessibly.`;
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

// Profile management
router.get("/profile", async (req, res) => {
  try {
    const userId = req.session.user_id;
    if (!userId) return res.redirect("/auth/login");

    const userRows = await db.query(
      "SELECT user_id, full_name, height_cm, weight_kg, medical_conditions FROM users WHERE user_id = $1",
      [userId]
    );
    const user = userRows[0] || {};

    // Get history of weight/height changes
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

    // Update user profile
    await db.query(
      `UPDATE users SET height_cm = $1, weight_kg = $2, medical_conditions = $3 WHERE user_id = $4`,
      [height_cm || null, weight_kg || null, medical_conditions || null, userId]
    );

    // Record to history (if table exists)
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

export default router;
