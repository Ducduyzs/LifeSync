import express from "express";
import { hfText } from "../services/ai.js";

const router = express.Router();

function extractJson(text) {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

router.post("/intent", async (req, res) => {
  try {
    const { message } = req.body;

    const prompt = `
You are an assistant for a productivity app.

Return ONLY valid JSON. No markdown. No explanations.

Detect user intent among:
- create_task
- create_project
- chat

If user wants to create a PROJECT but missing dates/duration, ask ONE short question:
{
  "intent": "clarify_project_time",
  "question": "..."
}

If user wants to create a TASK but missing duration, ask ONE short question:
{
  "intent": "clarify_task_time",
  "question": "..."
}

If user wants to create a PROJECT and time is clear or after clarification, return:
{
  "intent": "create_project",
  "name": "...",
  "description": "",
  "estimated_duration_days": number,
  "priority": "low|medium|high",
  "tags": []
}

If user wants to create a TASK and time is clear or after clarification, return:
{
  "intent": "create_task",
  "title": "...",
  "estimated_duration_minutes": number,
  "tags": []
}

Otherwise:
{
  "intent": "chat",
  "reply": "..."
}

User message:
"${message}"
`;

    const raw = await hfText(prompt);
    const parsed = extractJson(raw);

    if (parsed && parsed.intent) return res.json(parsed);

    return res.json({ intent: "chat", reply: raw || "Sorry, I couldn't understand." });
  } catch (err) {
    console.error("chat intent error:", err);
    return res.status(500).json({ intent: "chat", reply: "AI service error. Please try again." });
  }
});

export default router;
