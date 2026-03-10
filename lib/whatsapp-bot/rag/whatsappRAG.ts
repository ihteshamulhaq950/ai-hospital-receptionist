/**
 * lib/whatsapp-bot/rag/whatsappRAG.ts
 *
 * WhatsApp-optimized RAG pipeline.
 * Differences from web chat version:
 *  - No SSE / streaming / onProgress callbacks
 *  - medical_guidance → answered directly by classifier (no RAG, no Pinecone)
 *  - Hard 30s timeout on every async step
 *  - Single file — no indirection for simplicity
 */

import { callGeminiWithSchema } from "@/lib/ai/googleProvider";
import { getHospitalNamespace } from "@/lib/pinecone/pineconeClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type Intent =
  | "greeting"
  | "identity"
  | "hospital_info"
  | "complex_query"
  | "medical_guidance"
  | "unclear";

interface ClassifiedQuery {
  intent: Intent;
  refinedQuery: string;
  needsRAG: boolean;
  subQueries?: string[];
  answer?: string;       // only present for medical_guidance
  suggestions?: string[]; // only present for medical_guidance
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CLASSIFIER_SCHEMA = {
  type: "object",
  properties: {
    intent: {
      type: "string",
      enum: ["greeting", "identity", "hospital_info", "complex_query", "medical_guidance", "unclear"],
    },
    refinedQuery: { type: "string" },
    needsRAG: { type: "boolean" },
    subQueries: { type: "array", items: { type: "string" } },
    answer: { type: "string" },
    suggestions: { type: "array", items: { type: "string" } },
  },
  required: ["intent", "refinedQuery", "needsRAG"],
};

const ANSWER_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string" },
    suggestions: { type: "array", items: { type: "string" } },
  },
  required: ["answer", "suggestions"],
};

// ─── Helper: timeout race ─────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error(`[WA RAG] Timeout: ${label} exceeded ${ms}ms`)), ms),
    ),
  ]);
}

// ─── Step 1: Classify ─────────────────────────────────────────────────────────

const CLASSIFIER_PROMPT = (query: string) =>
  `You are a multilingual query classifier for a hospital WhatsApp assistant.

TASK
1. Detect intent
2. Translate non-English queries to English
3. Rewrite query for semantic hospital search if RAG is needed
4. Only generate answers when intent = "medical_guidance"

SUPPORTED INTENTS
- greeting        → needsRAG=false
- identity        → needsRAG=false
- hospital_info   → needsRAG=true
- complex_query   → needsRAG=true, split into subQueries
- medical_guidance → needsRAG=false
- unclear         → needsRAG=false

LANGUAGE RULE
Non-English input → translate to English first. Always output refinedQuery in English.

-------------------------------------
RAG QUERY REWRITE (when needsRAG=true)
- Expand abbreviations (OPD → Outpatient Department)
- Correct grammar, use formal hospital terminology
- Convert vague queries into structured documentation-style questions

Example:
"Where do I register?"
→ "What is the patient registration process and where is the registration counter located?"

-------------------------------------
MEDICAL GUIDANCE
If the user describes symptoms or asks which doctor to see:
Examples: "ear pain", "chest pain", "skin allergy", "my child has fever"

Classify as: intent = "medical_guidance", needsRAG = false, refinedQuery = "", subQueries = []

Specialist mappings:
Ear → ENT | Chest → Cardiologist | Skin → Dermatologist | Child illness → Pediatrician
Eye → Ophthalmologist | Bone/joint → Orthopedic | Stomach → Gastroenterologist

-------------------------------------
OUTPUT RULES
- medical_guidance → include "answer" + "suggestions" (exactly 5, plain text, WhatsApp-friendly)
- ALL other intents → NO answer, NO suggestions fields
- Return STRICT JSON only. No markdown, no explanations.

User Query: "${query}"

Return JSON using the correct shape for the detected intent:

If medical_guidance:
{
  "intent": "medical_guidance",
  "refinedQuery": "",
  "needsRAG": false,
  "subQueries": [],
  "answer": "plain text specialist recommendation",
  "suggestions": [
    "Is the ENT specialist available today?",
    "How do I book an ENT appointment?",
    "What are ENT department timings?",
    "Where is the ENT department located?",
    "What conditions does the ENT department treat?"
  ]
}

All other intents:
{
  "intent": "greeting|identity|hospital_info|complex_query|unclear",
  "refinedQuery": "optimized English query",
  "needsRAG": true|false,
  "subQueries": ["only for complex_query, else empty array"]
}`.trim();

async function classifyQuery(userQuery: string): Promise<ClassifiedQuery> {
  try {
    const result = await withTimeout(
      callGeminiWithSchema<ClassifiedQuery>({
        prompt: CLASSIFIER_PROMPT(userQuery),
        responseSchema: CLASSIFIER_SCHEMA,
        temperature: 0.2,
        maxOutputTokens: 512, // bumped: medical_guidance now returns answer + suggestions
      }),
      8_000,
      "classify",
    );

    return {
      intent: result.intent ?? "hospital_info",
      refinedQuery: result.refinedQuery ?? userQuery.trim(),
      needsRAG: result.needsRAG ?? true,
      subQueries:
        Array.isArray(result.subQueries) && result.subQueries.length > 0
          ? result.subQueries
          : undefined,
      // preserve medical_guidance fields if present
      answer: result.answer?.trim() || undefined,
      suggestions: Array.isArray(result.suggestions) && result.suggestions.length > 0
        ? result.suggestions
        : undefined,
    };
  } catch {
    // Pattern-based fallback — zero AI cost
    const lower = userQuery.toLowerCase().trim();
    if (/^(hi|hello|hey|salam|assalam)/i.test(lower))
      return { intent: "greeting", refinedQuery: userQuery, needsRAG: false };
    if (/who are you|what can you/i.test(lower))
      return { intent: "identity", refinedQuery: userQuery, needsRAG: false };
    if (/\band\b/.test(lower) || (lower.match(/\?/g) ?? []).length > 1)
      return { intent: "complex_query", refinedQuery: userQuery, needsRAG: true, subQueries: [userQuery] };
    return { intent: "hospital_info", refinedQuery: userQuery, needsRAG: true };
  }
}

// ─── Step 2: Vector search ────────────────────────────────────────────────────

async function searchPinecone(queries: string[], topK: number): Promise<string> {
  const namespace = getHospitalNamespace();
  const seenIds = new Set<string>();
  const allHits: any[] = [];

  await Promise.allSettled(
    queries.map(async (query) => {
      try {
        const res = await withTimeout(
          namespace.searchRecords({
            query: { topK, inputs: { text: query } },
            fields: ["text"],
          }),
          10_000,
          `pinecone:${query.slice(0, 30)}`,
        );
        const hits = res?.result?.hits ?? [];
        for (const hit of hits) {
          if (!seenIds.has(hit._id)) {
            seenIds.add(hit._id);
            allHits.push(hit);
          }
        }
      } catch (err) {
        console.error("[WA RAG] Pinecone query failed:", err);
      }
    }),
  );

  if (!allHits.length) return "";

  return allHits
    .sort((a, b) => (b._score ?? 0) - (a._score ?? 0))
    .slice(0, topK * 2)
    .map((hit, i) => `[${i + 1}] ${hit.fields?.text ?? ""}`)
    .join("\n\n");
}

// ─── Step 3: Generate answer ──────────────────────────────────────────────────

const ANSWER_PROMPT = (query: string, context: string) =>
  context
    ? `You are a hospital information assistant replying via WhatsApp.
Answer the question using ONLY the context below. Be concise (max 8 lines).
Plain text only — no bullet points, no markdown.

Context:
${context}

Question: ${query}

Return JSON: { "answer": "...", "suggestions": ["5 relevant follow-up questions"] }`
    : `You are a hospital information assistant replying via WhatsApp.
No relevant information was found. Politely say so in 1-2 sentences.
Plain text only — no markdown.

Question: ${query}

Return JSON: { "answer": "...", "suggestions": ["5 alternative questions the user could ask"] }`;

async function generateAnswer(query: string, context: string): Promise<{ answer: string; suggestions: string[] }> {
  try {
    const result = await withTimeout(
      callGeminiWithSchema<{ answer: string; suggestions: string[] }>({
        prompt: ANSWER_PROMPT(query, context),
        responseSchema: ANSWER_SCHEMA,
        temperature: 0.5,
        maxOutputTokens: 512,
      }),
      15_000,
      "generate",
    );
    return {
      answer: result.answer?.trim() || FALLBACK_ANSWER,
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
    };
  } catch {
    return {
      answer: context ? `Here's what I found:\n\n${context.slice(0, 600)}` : FALLBACK_ANSWER,
      suggestions: [],
    };
  }
}

// ─── Static non-RAG responses ─────────────────────────────────────────────────

const STATIC_RESPONSES: Record<string, string> = {
  greeting:
    "Hello! 👋 I'm your hospital information assistant. Ask me about timings, departments, appointments, services, or location.",
  identity:
    "I'm a hospital information assistant. I can help you with services, timings, departments, doctors, appointments, and more. What would you like to know?",
  unclear:
    "I'm not sure I understood that. I can help with hospital timings, departments, appointments, and services. Could you rephrase your question?",
};

const FALLBACK_ANSWER =
  "I'm having trouble answering right now. Please try again or contact the hospital directly.";

// ─── Main export ──────────────────────────────────────────────────────────────

export interface WhatsAppRAGResult {
  answer: string;
  suggestions: string[];
}

/**
 * WhatsApp RAG entry point.
 * Returns { answer, suggestions } for all intents.
 * medical_guidance is answered directly by the classifier — no Pinecone, no generateAnswer.
 */
export async function getWhatsAppAnswer(userMessage: string): Promise<WhatsAppRAGResult> {
  console.log("[WA RAG] Query:", userMessage);

  try {
    const classified = await classifyQuery(userMessage);
    console.log("[WA RAG] Intent:", classified.intent, "| needsRAG:", classified.needsRAG);

    // medical_guidance — classifier already generated answer + suggestions, skip RAG entirely
    if (classified.intent === "medical_guidance") {
      return {
        answer: classified.answer ?? FALLBACK_ANSWER,
        suggestions: classified.suggestions ?? [],
      };
    }

    // Static responses for greeting / identity / unclear — no suggestions
    if (!classified.needsRAG) {
      return {
        answer: STATIC_RESPONSES[classified.intent] ?? STATIC_RESPONSES.unclear,
        suggestions: [],
      };
    }

    // hospital_info / complex_query — full RAG pipeline
    const queries = classified.subQueries?.length
      ? classified.subQueries
      : [classified.refinedQuery];

    const context = await searchPinecone(queries, 3);
    console.log("[WA RAG] Context chars:", context.length);

    const result = await generateAnswer(userMessage, context);
    console.log("[WA RAG] Done. Answer length:", result.answer.length);

    return result;
  } catch (err) {
    console.error("[WA RAG] Fatal error:", err);
    return { answer: FALLBACK_ANSWER, suggestions: [] };
  }
}

// /**
//  * lib/whatsapp-bot/rag/whatsappRAG.ts
//  *
//  * WhatsApp-optimized RAG pipeline.
//  * Differences from web chat version:
//  *  - No SSE / streaming / onProgress callbacks
//  *  - Returns plain { answer: string } — no suggestions needed
//  *  - Hard 30s timeout on every async step
//  *  - Single file — no indirection for simplicity
//  */

// import { callGeminiWithSchema } from "@/lib/ai/googleProvider";
// import { getHospitalNamespace } from "@/lib/pinecone/pineconeClient";

// // ─── Types (local, no shared types needed) ───────────────────────────────────

// type Intent =
//   | "greeting"
//   | "identity"
//   | "hospital_info"
//   | "complex_query"
//   | "medical_guidance"
//   | "unclear";

// interface ClassifiedQuery {
//   intent: Intent;
//   refinedQuery: string;
//   needsRAG: boolean;
//   subQueries?: string[];
//   answer?: string; // only for medical_guidance
// }

// // ─── Schemas (reuse same Gemini structured-output pattern) ───────────────────

// const CLASSIFIER_SCHEMA = {
//   type: "object",
//   properties: {
//     intent: {
//       type: "string",
//       enum: [
//         "greeting",
//         "identity",
//         "hospital_info",
//         "complex_query",
//         "medical_guidance",
//         "unclear",
//       ],
//     },
//     refinedQuery: { type: "string" },
//     needsRAG: { type: "boolean" },
//     subQueries: { type: "array", items: { type: "string" } },
//     answer: { type: "string" }, // only for medical_guidance
//   },
//   required: ["intent", "refinedQuery", "needsRAG"],
// };

// const ANSWER_SCHEMA = {
//   type: "object",
//   properties: {
//     answer: { type: "string" },
//   },
//   required: ["answer"],
// };

// // ─── Helper: race any promise against a timeout ───────────────────────────────

// function withTimeout<T>(
//   promise: Promise<T>,
//   ms: number,
//   label: string,
// ): Promise<T> {
//   return Promise.race([
//     promise,
//     new Promise<never>((_, rej) =>
//       setTimeout(
//         () => rej(new Error(`[WA RAG] Timeout: ${label} exceeded ${ms}ms`)),
//         ms,
//       ),
//     ),
//   ]);
// }

// // ─── Step 1: Classify ─────────────────────────────────────────────────────────

// const CLASSIFIER_PROMPT = (query: string) =>
//   `You are a multilingual query classifier for a hospital WhatsApp assistant.

// TASK
// 1. Detect intent
// 2. Translate non-English queries to English
// 3. Rewrite query for semantic hospital search if RAG is needed
// 4. Only generate answers when intent = "medical_guidance"

// SUPPORTED INTENTS
// - greeting       → needsRAG=false
// - identity       → needsRAG=false
// - hospital_info  → needsRAG=true
// - complex_query  → needsRAG=true, split into subQueries
// - medical_guidance → needsRAG=false
// - unclear        → needsRAG=false

// LANGUAGE RULE
// Non-English input → translate to English first. Always output refinedQuery in English.

// -------------------------------------
// RAG QUERY REWRITE (when needsRAG=true)
// - Expand abbreviations (OPD → Outpatient Department)
// - Correct grammar, use formal hospital terminology
// - Convert vague queries into structured documentation-style questions

// Example:
// "Where do I register?"
// → "What is the patient registration process and where is the registration counter located?"

// -------------------------------------
// MEDICAL GUIDANCE
// If the user describes symptoms or asks which doctor to see:
// Examples: "ear pain", "chest pain", "skin allergy", "my child has fever"

// Classify as: intent = "medical_guidance", needsRAG = false, refinedQuery = "", subQueries = []

// Specialist mappings:
// Ear → ENT | Chest → Cardiologist | Skin → Dermatologist | Child illness → Pediatrician
// Eye → Ophthalmologist | Bone/joint → Orthopedic | Stomach → Gastroenterologist

// REQUIRED output shape for medical_guidance:
// {
//   "intent": "medical_guidance",
//   "refinedQuery": "",
//   "needsRAG": false,
//   "subQueries": [],
//   "answer": "For ear symptoms consult an ENT (Ear, Nose and Throat) specialist."
// }

// Note: For WhatsApp, medical guidance returns a plain "answer" string (no metaData wrapper).

// -------------------------------------
// OUTPUT RULES
// - medical_guidance → include "answer" field, plain text, no markdown
// - ALL other intents → NO answer field
// - Return STRICT JSON only. No markdown, no explanations.

// User Query: "${query}"

// Return JSON using the correct shape for the detected intent:

// If medical_guidance:
// {
//   "intent": "medical_guidance",
//   "refinedQuery": "",
//   "needsRAG": false,
//   "subQueries": [],
//   "answer": "plain text specialist recommendation"
// }

// All other intents:
// {
//   "intent": "greeting|identity|hospital_info|complex_query|unclear",
//   "refinedQuery": "optimized English query",
//   "needsRAG": true|false,
//   "subQueries": ["only for complex_query, else empty array"]
// }`.trim();

// async function classifyQuery(userQuery: string): Promise<ClassifiedQuery> {
//   try {
//     const result = await withTimeout(
//       callGeminiWithSchema<ClassifiedQuery>({
//         prompt: CLASSIFIER_PROMPT(userQuery),
//         responseSchema: CLASSIFIER_SCHEMA,
//         temperature: 0.2,
//         maxOutputTokens: 256,
//       }),
//       8_000,
//       "classify",
//     );

//     return {
//       intent: result.intent ?? "hospital_info",
//       refinedQuery: result.refinedQuery ?? userQuery.trim(),
//       needsRAG: result.needsRAG ?? true,
//       subQueries:
//         Array.isArray(result.subQueries) && result.subQueries.length > 0
//           ? result.subQueries
//           : undefined,
//     };
//   } catch {
//     // Pattern-based fallback — zero AI cost
//     const lower = userQuery.toLowerCase().trim();
//     if (/^(hi|hello|hey|salam|assalam)/i.test(lower))
//       return { intent: "greeting", refinedQuery: userQuery, needsRAG: false };
//     if (/who are you|what can you/i.test(lower))
//       return { intent: "identity", refinedQuery: userQuery, needsRAG: false };
//     if (/\band\b/.test(lower) || (lower.match(/\?/g) ?? []).length > 1)
//       return {
//         intent: "complex_query",
//         refinedQuery: userQuery,
//         needsRAG: true,
//         subQueries: [userQuery],
//       };
//     return { intent: "hospital_info", refinedQuery: userQuery, needsRAG: true };
//   }
// }

// // ─── Step 2: Vector search ────────────────────────────────────────────────────

// async function searchPinecone(
//   queries: string[],
//   topK: number,
// ): Promise<string> {
//   const namespace = getHospitalNamespace();
//   const seenIds = new Set<string>();
//   const allHits: any[] = [];

//   await Promise.allSettled(
//     queries.map(async (query) => {
//       try {
//         const res = await withTimeout(
//           namespace.searchRecords({
//             query: { topK, inputs: { text: query } },
//             fields: ["text"],
//           }),
//           10_000,
//           `pinecone:${query.slice(0, 30)}`,
//         );
//         const hits = res?.result?.hits ?? [];
//         for (const hit of hits) {
//           if (!seenIds.has(hit._id)) {
//             seenIds.add(hit._id);
//             allHits.push(hit);
//           }
//         }
//       } catch (err) {
//         console.error("[WA RAG] Pinecone query failed:", err);
//       }
//     }),
//   );

//   if (!allHits.length) return "";

//   return allHits
//     .sort((a, b) => (b._score ?? 0) - (a._score ?? 0))
//     .slice(0, topK * 2) // cap results
//     .map((hit, i) => `[${i + 1}] ${hit.fields?.text ?? ""}`)
//     .join("\n\n");
// }

// // ─── Step 3: Generate answer ──────────────────────────────────────────────────

// const ANSWER_PROMPT = (query: string, context: string) =>
//   context
//     ? `You are a hospital information assistant replying via WhatsApp.
// Answer the question using ONLY the context below. Be concise (max 8 lines).
// Do NOT add bullet points or markdown — plain text only for WhatsApp.

// Context:
// ${context}

// Question: ${query}

// Return JSON: { "answer": "..." }`
//     : `You are a hospital information assistant replying via WhatsApp.
// No relevant information was found for this question. Politely say so in 1-2 sentences.
// Suggest the user ask about: timings, departments, appointments, or location.
// Plain text only — no markdown.

// Question: ${query}

// Return JSON: { "answer": "..." }`;

// async function generateAnswer(query: string, context: string): Promise<string> {
//   try {
//     const result = await withTimeout(
//       callGeminiWithSchema<{ answer: string }>({
//         prompt: ANSWER_PROMPT(query, context),
//         responseSchema: ANSWER_SCHEMA,
//         temperature: 0.5,
//         maxOutputTokens: 512,
//       }),
//       15_000,
//       "generate",
//     );
//     return result.answer?.trim() || FALLBACK_ANSWER;
//   } catch {
//     return context
//       ? `Here's what I found:\n\n${context.slice(0, 600)}`
//       : FALLBACK_ANSWER;
//   }
// }

// // ─── Static non-RAG responses ─────────────────────────────────────────────────

// const STATIC_RESPONSES: Record<string, string> = {
//   greeting:
//     "Hello! 👋 I'm your hospital information assistant. Ask me about timings, departments, appointments, services, or location.",
//   identity:
//     "I'm a hospital information assistant. I can help you with services, timings, departments, doctors, appointments, and more. What would you like to know?",
//   unclear:
//     "I'm not sure I understood that. I can help with hospital timings, departments, appointments, and services. Could you rephrase your question?",
// };

// const FALLBACK_ANSWER =
//   "I'm having trouble answering right now. Please try again or contact the hospital directly.";

// // ─── Main export ──────────────────────────────────────────────────────────────

// /**
//  * WhatsApp RAG entry point.
//  * Returns a single plain-text answer string — no suggestions, no streaming.
//  */
// export async function getWhatsAppAnswer(userMessage: string): Promise<string> {
//   console.log("[WA RAG] Query:", userMessage);

//   try {
//     // 1. Classify
//     const classified = await classifyQuery(userMessage);
//     console.log(
//       "[WA RAG] Intent:",
//       classified.intent,
//       "| needsRAG:",
//       classified.needsRAG,
//     );

//     // 2. Static response (no Pinecone / LLM cost)
//     if (!classified.needsRAG) {
//       return STATIC_RESPONSES[classified.intent] ?? STATIC_RESPONSES.unclear;
//     }

//     // 3. Vector search
//     const queries = classified.subQueries?.length
//       ? classified.subQueries
//       : [classified.refinedQuery];

//     const context = await searchPinecone(queries, 3);
//     console.log("[WA RAG] Context chars:", context.length);

//     // 4. Generate answer
//     const answer = await generateAnswer(userMessage, context);
//     console.log("[WA RAG] Done. Answer length:", answer.length);

//     return answer;
//   } catch (err) {
//     console.error("[WA RAG] Fatal error:", err);
//     return FALLBACK_ANSWER;
//   }
// }
