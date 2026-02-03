// lib/ai/googleProvider.ts
// MODULAR GOOGLE PROVIDER - GENERIC & REUSABLE

import { GenerateContentParameters, GoogleGenAI } from "@google/genai";
import { generateAnswer } from "../rag/agenticAnswerGenerator";
import { GeminiCallOptions } from "@/types/ai";
import { HospitalAnswer } from "@/types/rag";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});



/**
 * Generic Gemini API caller with structured JSON output
 * This is the single source of truth for all AI calls
 */
export async function callGeminiWithSchema<T>(options: GeminiCallOptions): Promise<T> {
  const {
    prompt,
    responseSchema,
    model = "gemini-2.5-flas",
    temperature = 0.7,
    maxOutputTokens = 1024,
  } = options;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema,
        temperature,
        maxOutputTokens,
      } as GenerateContentParameters["config"]
    } as GenerateContentParameters);

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    console.log(`[Gemini ${model}] Response:`, text.substring(0, 200));

    return JSON.parse(text) as T;

  } catch (error) {
    console.error(`[Gemini ${model}] Error:`, error);
    throw error;
  }
}




// 3. UNIFIED INTERFACE (Optional - for backward compatibility)
/**
 * Legacy function name for backward compatibility
 * Use generateAnswer() directly in new code
 */
export async function generateHospitalAnswer(
  userQuery: string,
  context: string
): Promise<HospitalAnswer> {
  return generateAnswer(userQuery, context);
}

// 4. CONNECTION TESTER
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ role: "user", parts: [{ text: "Say 'hello'" }] }],
    });
    
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("[Connection Test] Success:", text);
    return !!text;
  } catch (error) {
    console.error("[Connection Test] Failed:", error);
    return false;
  }
}



// import { GenerateContentParameters, GoogleGenAI } from "@google/genai";

// const ai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY!,
// });

// /**
//  * Generate hospital answer + AI-driven follow-up suggestions
//  */
// export async function generateHospitalAnswer(
//   query: string,
//   context: string
// ): Promise<{ answer: string; suggestions?: string[] }> {
//   // Build prompt
//   const prompt = `
// You are a hospital information assistant.

// RULES:
// - Answer ONLY from the given context.
// - Maximum 10 lines.
// - Clear, short, factual.
// - If answer is missing or context is insufficient, say: "Information not available".
// - ALWAYS generate 5-6 follow-up questions for the user:
//     - If context is available, base them on the context.
//     - If context is missing, base them on the user's input. 
//       Try your best to interpret the user's input and generate semantic, AI-driven questions
//       that expand on the short query meaningfully (e.g., if user typed a hospital name, 
//       suggest questions about address, visiting hours, appointments, services, departments, doctors).

// Context:
// ${context}

// User Question:
// ${query}

// Output JSON format:
// {
//   "answer": "<short factual answer or 'Information not available'>",
//   "suggestions": ["question 1", "question 2", "question 3", "question 4", "question 5"]
// }
// `;

//   const response = await ai.models.generateContent({
//     model: "gemini-2.5-flash",
//     contents: [{ role: "user", parts: [{ text: prompt }] }],
//     config: {
//       responseMimeType: "application/json",
//       responseSchema: {
//         type: "object",
//         properties: {
//           answer: {
//             type: "string",
//             description: "Short factual answer or 'Information not available'"
//           },
//           suggestions: {
//             type: "array",
//             items: { type: "string" },
//             description: "5-6 follow-up questions"
//           }
//         },
//         required: ["answer", "suggestions"]
//       }
//     } 
//   } as GenerateContentParameters);

//   const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

//   try {
//     const parsed = JSON.parse(text);
//     console.log("parsed.answer is:", parsed.answer);
//     console.log("parsed.suggestions is:", parsed.suggestions);
    
    
//     return {
//       answer: parsed.answer ?? "Information not available",
//       suggestions: parsed.suggestions ?? [],
//     };
//   } catch (e) {
//     return {
//       answer: text || "Information not available",
//       suggestions: [],
//     };
//   }
// }
