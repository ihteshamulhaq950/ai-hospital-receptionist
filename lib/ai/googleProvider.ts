// lib/ai/googleProvider.ts
// MODULAR GOOGLE PROVIDER - GENERIC & REUSABLE

import { GenerateContentParameters, GoogleGenAI } from "@google/genai";
import { GeminiCallOptions } from "@/types/ai";

// ─── Collect all available API keys ──────────────────────────────────────────

const GEMINI_API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
].filter(Boolean) as string[];

if (GEMINI_API_KEYS.length === 0) {
  throw new Error("[Gemini] No API keys found. Set GEMINI_API_KEY_1 in .env");
}

function getRandomClient(): GoogleGenAI {
  const key = GEMINI_API_KEYS[Math.floor(Math.random() * GEMINI_API_KEYS.length)];
  return new GoogleGenAI({ apiKey: key });
}

// ─── Generic Gemini API caller with structured JSON output ────────────────────

export async function callGeminiWithSchema<T>(options: GeminiCallOptions): Promise<T> {
  const {
    prompt,
    responseSchema,
    model = "gemini-2.5-flash",
    temperature = 0.7,
    maxOutputTokens = 1024,
  } = options;

  try {
    const ai = getRandomClient();

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema,
        temperature,
        maxOutputTokens,
      } as GenerateContentParameters["config"],
    } as GenerateContentParameters);

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    console.log(`[Gemini ${model}] Response:`, text.substring(0, 200));

    return JSON.parse(text) as T;

  } catch (error) {
    console.error(`[Gemini ${model}] Error:`, error);
    throw error;
  }
}

// // lib/ai/googleProvider.ts
// // MODULAR GOOGLE PROVIDER - GENERIC & REUSABLE

// import { GenerateContentParameters, GoogleGenAI } from "@google/genai";
// import { GeminiCallOptions } from "@/types/ai";

// const ai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY!,
// });



// /**
//  * Generic Gemini API caller with structured JSON output
//  * This is the single source of truth for all AI calls
//  */
// export async function callGeminiWithSchema<T>(options: GeminiCallOptions): Promise<T> {
//   const {
//     prompt,
//     responseSchema,
//     model = "gemini-2.5-flash",
//     temperature = 0.7,
//     maxOutputTokens = 1024,
//   } = options;

//   try {
//     const response = await ai.models.generateContent({
//       model,
//       contents: [{ role: "user", parts: [{ text: prompt }] }],
//       config: {
//         responseMimeType: "application/json",
//         responseSchema,
//         temperature,
//         maxOutputTokens,
//       } as GenerateContentParameters["config"]
//     } as GenerateContentParameters);

//     const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
//     console.log(`[Gemini ${model}] Response:`, text.substring(0, 200));

//     return JSON.parse(text) as T;

//   } catch (error) {
//     console.error(`[Gemini ${model}] Error:`, error);
//     throw error;
//   }
// }
