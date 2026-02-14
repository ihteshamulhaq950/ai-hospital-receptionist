// lib/rag/queryClassifier.ts
import { callGeminiWithSchema } from "../ai/googleProvider";
import { ClassifiedQuery, QUERY_CLASSIFIER_SCHEMA } from "@/types/rag";

const CLASSIFIER_SYSTEM_PROMPT = `
You are a multilingual query classifier for a hospital information system.

IMPORTANT RULES:
1. If the user query is in Urdu or any non-English language:
   - First translate it into clear English.
   - Use the translated English for classification and refinement.
2. Always return refinedQuery in English only.
3. Optimize refinedQuery for semantic search:
   - Expand abbreviations if needed (e.g., OPD → Outpatient Department).
   - Correct spelling.
   - Make it clear, formal, and searchable.
4. Do NOT explain anything.
5. Output STRICT JSON only (no markdown, no text outside JSON).

Classification Categories:

- "greeting":
  Examples: hi, hello, salam, assalamualaikum
  → needsRAG: false

- "identity":
  Examples: who are you, what can you do, tum kya ho
  → needsRAG: false

- "hospital_info":
  Single clear hospital-related question
  → needsRAG: true

- "complex_query":
  Multiple hospital questions in one query
  → needsRAG: true
  → Split into clear English subQueries

- "unclear":
  Vague, incomplete, off-topic, or unrelated to hospital
  → needsRAG: false

Examples:

Urdu Input:
"opd ka time kya hai"
→ {
  "intent": "hospital_info",
  "refinedQuery": "What are the operating hours of the Outpatient Department (OPD)?",
  "needsRAG": true,
  "subQueries": []
}

Complex Urdu:
"opd ka time aur hospital ka address kya hai"
→ {
  "intent": "complex_query",
  "refinedQuery": "What are the OPD operating hours and what is the hospital address?",
  "needsRAG": true,
  "subQueries": [
    "What are the OPD operating hours?",
    "What is the hospital address?"
  ]
}
`;


// build final and classfied query from raw user query

function buildClassifierPrompt(userQuery: string): string {
  return `${CLASSIFIER_SYSTEM_PROMPT}

User Query:
"${userQuery}"

Now:
1. Detect language.
2. Translate to English if needed.
3. Classify intent.
4. Generate optimized refinedQuery in English.
5. Split into subQueries if complex.

Return ONLY valid JSON in this format:

{
  "intent": "greeting" | "identity" | "hospital_info" | "complex_query" | "unclear",
  "refinedQuery": "optimized English search query",
  "needsRAG": true/false,
  "subQueries": ["sub-query 1", "sub-query 2"] // only for complex_query, otherwise empty array
}
`;
}


// Fallback classfier (No AI calls)
function classifyWithPatterns(userQuery: string): ClassifiedQuery {
  const lower = userQuery.toLowerCase().trim();

  // Check for greetings
  if (/^(hi|hello|hey|good morning|good evening|good afternoon)/i.test(lower)) {
    return { intent: "greeting", refinedQuery: userQuery, needsRAG: false };
  }

  // Check for identity questions
  if (
    /who are you|what (can|do) you|your (purpose|function|capabilities)/i.test(
      lower,
    )
  ) {
    return { intent: "identity", refinedQuery: userQuery, needsRAG: false };
  }

  // Check for complex queries (presence of "and" or multiple question marks)
  if (/\s+and\s+/i.test(lower) || (lower.match(/\?/g) || []).length > 1) {
    return {
      intent: "complex_query",
      refinedQuery: userQuery.trim(),
      needsRAG: true,
      subQueries: [userQuery.trim()],
    };
  }

  // Default: assume hospital info query
  return {
    intent: "hospital_info",
    refinedQuery: userQuery.trim(),
    needsRAG: true,
  };
}


async function classifyWithAI(userQuery: string): Promise<ClassifiedQuery> {
  try {
    const result = await callGeminiWithSchema<ClassifiedQuery>({
      prompt: buildClassifierPrompt(userQuery),
      responseSchema: QUERY_CLASSIFIER_SCHEMA,
      temperature: 0.3,
      maxOutputTokens: 512,
    });

    console.log("[AI Classifier] Result:", result);

    return {
      intent: result.intent ?? "hospital_info",
      refinedQuery: result.refinedQuery ?? userQuery.trim(),
      needsRAG: result.needsRAG ?? true,
      subQueries: Array.isArray(result.subQueries) && result.subQueries.length > 0
        ? result.subQueries
        : undefined,
    }
    
  } catch (error) {
    console.error("[AI Classifier] Failed:", error);
    throw error; // let the called handle the fallback
  }
}

/**
 * Main function to classify and refine the user query. It first tries the AI-based classifier, and if that fails, it falls back to pattern-based classification.
 */
export async function classifyQuery(
  userQuery: string,
): Promise<ClassifiedQuery> {
  console.log("[Query Classifier] Processing:", userQuery);

  try {
    // Try AI classification first
    const aiResult = await classifyWithAI(userQuery);
    console.log("[Query Classifier] AI classification successful");
    return aiResult;
  } catch (error) {
    console.warn("[Query Classifier] AI classification failed, using pattern-based fallback:", error);
    const fallbackResult = classifyWithPatterns(userQuery);
    return fallbackResult;
  }
}
