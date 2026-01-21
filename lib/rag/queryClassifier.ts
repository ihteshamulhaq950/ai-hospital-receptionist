// lib/rag/queryClassifier.ts;

export type QueryIntent =
  | "greeting"
  | "identity"
  | "hospital_info"
  | "complex_query"
  | "unclear";

export interface ClassifiedQuery {
  intent: QueryIntent;
  refinedQuery: string;
  needsRAG: boolean;
  subQueries?: string[];
}

export async function classifyAndRefineQuery(
  userQuery: string,
  llmFunction: (prompt: string) => Promise<string>,
): Promise<ClassifiedQuery> {
  const classificationPrompt = `You are a query classifier for a hospital information system.

        Analyze this user query and respond with ONLY valid JSON (no markdown, no explanation):

        User Query: "${userQuery}"

        Classify the intent and refine the query:

        {
        "intent": "greeting" | "identity" | "hospital_info" | "complex_query" | "unclear",
        "refinedQuery": "optimized search query for RAG system",
        "needsRAG": true/false,
        "subQueries": ["sub-query 1", "sub-query 2"] // only for complex queries
        }

        Rules:
        - "greeting": hi, hello, hey, etc. → needsRAG: false
        - "identity": who are you, what can you do → needsRAG: false
        - "hospital_info": specific hospital questions → needsRAG: true, create clear refined query
        - "complex_query": multiple questions in one (e.g., "OPD timing and hospital address") → needsRAG: true, split into subQueries
        - "unclear": vague or off-topic → needsRAG: false

        For complex queries like "what is OPD timing and hospital name", split into:
        ["OPD timing", "hospital name and address"]

        Respond with ONLY the JSON object.`;

  try {
    const response = await llmFunction(classificationPrompt);
    const cleanResponse = response.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanResponse);
  } catch (error) {
    console.error("Query classification failed:", error);
    // Fallback classification
    return {
      intent: "hospital_info",
      refinedQuery: userQuery.trim(),
      needsRAG: true,
    };
  }
}
