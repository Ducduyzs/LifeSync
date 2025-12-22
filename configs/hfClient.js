//Connect to Google Gemini
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function hfText(prompt, options = {}) {
  if (!GEMINI_API_KEY) {
    return "AI service chưa được cấu hình. Vui lòng thiết lập GEMINI_API_KEY.";
  }
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
        generationConfig: {
          maxOutputTokens: options.maxTokens || 32768,
          temperature: options.temperature ?? 0.7,
      },
    });

    const response = result.response;
    const text = response.text();

    if (!text) return "AI không thể phân tích nội dung.";
    return text.trim();
  } catch (err) {
    console.error("Gemini error:", err);
    return "AI đang gặp sự cố, hãy thử lại sau.";
  }
}
