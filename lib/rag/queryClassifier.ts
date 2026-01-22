// lib/rag/queryClassifier.ts
import { callGeminiWithSchema } from "../ai/googleProvider";

// 1. QUERY CLASSIFIER (stream api)
export type QueryIntent =
  | "greeting"
  | "identity"
  | "hospital_info"
  | "complex_query"
  | "unclear";

interface ClassifiedQuery {
  intent: QueryIntent;
  refinedQuery: string;
  needsRAG: boolean;
  subQueries?: string[];
}

const QUERY_CLASSIFIER_SCHEMA = {
  type: "object",
  properties: {
    intent: {
      type: "string",
      enum: [
        "greeting",
        "identity",
        "hospital_info",
        "complex_query",
        "unclear",
      ],
    },
    refinedQuery: { type: "string" },
    needsRAG: { type: "boolean" },
    subQueries: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["intent", "refinedQuery", "needsRAG"],
};

// build final and classfied query from raw user query
function buildClassifierPrompt(userQuery: string): string {
  return `You are a query classifier for a hospital information system.

Analyze this user query and determine:
1. The intent (greeting, identity question, hospital info, complex query, or unclear)
2. A refined/optimized version for search
3. Whether RAG (knowledge base search) is needed
4. If it's complex, split into sub-queries

User Query: "${userQuery}"

Classification Rules:
- "greeting": hi, hello, hey, good morning, etc. → needsRAG: false
- "identity": who are you, what can you do, your capabilities → needsRAG: false
- "hospital_info": specific hospital questions → needsRAG: true, create clear refined query
- "complex_query": multiple questions in one (e.g., "OPD timing AND hospital address") → needsRAG: true, split into subQueries
- "unclear": vague, off-topic, or non-hospital related → needsRAG: false

Examples:
- "what is opd timing and hospital name" → complex_query, subQueries: ["OPD operating hours", "hospital name and location"]
- "hi there" → greeting, needsRAG: false
- "who are you" → identity, needsRAG: false
- "what are the opd timings" → hospital_info, needsRAG: true
- "xyz random text" → unclear, needsRAG: false

Output JSON format:
{
  "intent": "greeting" | "identity" | "hospital_info" | "complex_query" | "unclear",
  "refinedQuery": "optimized search query",
  "needsRAG": true/false,
  "subQueries": ["sub-query 1", "sub-query 2"] // only for complex_query, otherwise empty array
}`;
}

export async function classifyQuery(
  userQuery: string,
): Promise<ClassifiedQuery> {
  try {
    const result = await callGeminiWithSchema<ClassifiedQuery>({
      prompt: buildClassifierPrompt(userQuery),
      responseSchema: QUERY_CLASSIFIER_SCHEMA,
      temperature: 0.3, // Lower for consistent classification
      maxOutputTokens: 512,
    });

    console.log("[Classifier] Result:", result);

    return {
      intent: result.intent ?? "hospital_info",
      refinedQuery: result.refinedQuery ?? userQuery.trim(),
      needsRAG: result.needsRAG ?? true,
      subQueries:
        Array.isArray(result.subQueries) && result.subQueries.length > 0
          ? result.subQueries
          : undefined,
    };
  } catch (error) {
    console.error("[Classifier] Failed, using fallback:", error);
    return fallbackClassification(userQuery);
  }
}

function fallbackClassification(userQuery: string): ClassifiedQuery {
  const lower = userQuery.toLowerCase().trim();

  if (/^(hi|hello|hey|good morning|good evening|good afternoon)/i.test(lower)) {
    return { intent: "greeting", refinedQuery: userQuery, needsRAG: false };
  }

  if (
    /who are you|what (can|do) you|your (purpose|function|capabilities)/i.test(
      lower,
    )
  ) {
    return { intent: "identity", refinedQuery: userQuery, needsRAG: false };
  }

  if (/\s+and\s+/i.test(lower) || (lower.match(/\?/g) || []).length > 1) {
    return {
      intent: "complex_query",
      refinedQuery: userQuery.trim(),
      needsRAG: true,
      subQueries: [userQuery.trim()],
    };
  }

  return {
    intent: "hospital_info",
    refinedQuery: userQuery.trim(),
    needsRAG: true,
  };
}

/**
 * Classify and refine user queries
 * Now uses the modular Google Provider
 */
export async function classifyAndRefineQuery(
  userQuery: string,
): Promise<ClassifiedQuery> {
  console.log("[Query Classifier] Processing:", userQuery);

  // Simply delegate to the generic Google Provider
  const result = await classifyQuery(userQuery);

  console.log("[Query Classifier] Result:", result);
  return result;
}
