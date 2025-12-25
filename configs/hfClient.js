//Connect to Google Gemini
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function hfText(prompt, options = {}) {
  if (!GEMINI_API_KEY) {
    return "AI service is not configured.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxTokens || 2048,
      },
    });

    const text = response?.text;
    return text ? String(text).trim() : "AI could not process the request.";
  } catch (err) {
    console.error("Gemini error:", err);
    return "AI service error.";
  }
}
