// lib/ai/googleProvider.ts (updated)


// export async function generateHospitalAnswer(
//   userQuery: string,
//   context: string
// ): Promise<{ answer: string; suggestions: string[] }> {
//   const hasContext = context.trim().length > 0;

//   const systemPrompt = hasContext
//     ? `You are a helpful hospital information assistant. Answer the user's question using ONLY the provided context from the hospital's knowledge base.

// Rules:
// - Be accurate, clear, and concise
// - Use ONLY information from the context
// - If the context doesn't fully answer the question, say so honestly
// - Format the answer in a friendly, professional manner
// - Provide 3 relevant follow-up question suggestions
// - DO NOT make up information

// Context:
// ${context}

// User Question: ${userQuery}

// Respond with ONLY valid JSON (no markdown):
// {
//   "answer": "your detailed answer here",
//   "suggestions": ["question 1", "question 2", "question 3"]
// }`
//     : `You are a helpful hospital information assistant. The user asked a question but no relevant information was found in the knowledge base.

// User Question: ${userQuery}

// Respond politely that you don't have that specific information, and provide 3-4 helpful alternative questions they might want to ask about the hospital.

// Respond with ONLY valid JSON (no markdown):
// {
//   "answer": "polite response acknowledging you don't have that info",
//   "suggestions": ["question 1", "question 2", "question 3", "question 4"]
// }`;

//   try {
//     // Your existing Gemini API call here
//     const response = await callGeminiAPI(systemPrompt);
//     const cleanResponse = response.replace(/```json\n?|\n?```/g, "").trim();
//     return JSON.parse(cleanResponse);
//   } catch (error) {
//     console.error("LLM generation error:", error);
//     return {
//       answer: "I encountered an error generating a response. Please try again.",
//       suggestions: [],
//     };
//   }
// }


import { GenerateContentParameters, GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

/**
 * Generate hospital answer + AI-driven follow-up suggestions
 */
export async function generateHospitalAnswer(
  query: string,
  context: string
): Promise<{ answer: string; suggestions?: string[] }> {
  // Build prompt
  const prompt = `
You are a hospital information assistant.

RULES:
- Answer ONLY from the given context.
- Maximum 10 lines.
- Clear, short, factual.
- If answer is missing or context is insufficient, say: "Information not available".
- ALWAYS generate 5-6 follow-up questions for the user:
    - If context is available, base them on the context.
    - If context is missing, base them on the user's input. 
      Try your best to interpret the user's input and generate semantic, AI-driven questions
      that expand on the short query meaningfully (e.g., if user typed a hospital name, 
      suggest questions about address, visiting hours, appointments, services, departments, doctors).

Context:
${context}

User Question:
${query}

Output JSON format:
{
  "answer": "<short factual answer or 'Information not available'>",
  "suggestions": ["question 1", "question 2", "question 3", "question 4", "question 5"]
}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          answer: {
            type: "string",
            description: "Short factual answer or 'Information not available'"
          },
          suggestions: {
            type: "array",
            items: { type: "string" },
            description: "5-6 follow-up questions"
          }
        },
        required: ["answer", "suggestions"]
      }
    } 
  } as GenerateContentParameters);

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  try {
    const parsed = JSON.parse(text);
    console.log("parsed.answer is:", parsed.answer);
    console.log("parsed.suggestions is:", parsed.suggestions);
    
    
    return {
      answer: parsed.answer ?? "Information not available",
      suggestions: parsed.suggestions ?? [],
    };
  } catch (e) {
    return {
      answer: text || "Information not available",
      suggestions: [],
    };
  }
}
