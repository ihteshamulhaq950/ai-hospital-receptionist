// types/rag.ts

export interface AnswerWithContextParams {
  content: string;
  namespace: any;
  generateAnswer: (query: string, context: string) => Promise<{
    answer: string;
    suggestions: string[];
  }>;
  topK?: number;
  onProgress?: (stage: string, details?: any) => void;
}

export interface AnswerWithContextResult {
  assistantContent: {
    answer: string;
    suggestions: string[];
  };
  contextUsed: ContextUsedItem[];
}

export interface ContextUsedItem {
  id: string;
  score: number;
  page: number | null;
}



export interface HospitalAnswer {
  answer: string;
  suggestions: string[];
}


// export type QueryIntent =
//   | "greeting"
//   | "identity"
//   | "hospital_info"
//   | "complex_query"
//   | "unclear";

export type QueryIntent =
  | "greeting"
  | "identity"
  | "hospital_info"
  | "complex_query"
  | "medical_guidance"
  | "unclear";

export interface ClassifiedQuery {
  intent: QueryIntent;
  refinedQuery: string;
  needsRAG: boolean;
  subQueries?: string[];
  metaData?: {
    answer: string;
    suggestions: string[];
  };
}

export const QUERY_CLASSIFIER_SCHEMA = {
  type: "object",
  properties: {
    intent: {
      type: "string",
      enum: [
        "greeting",
        "identity",
        "hospital_info",
        "complex_query",
        "medical_guidance",
        "unclear",
      ],
    },
    refinedQuery: { type: "string" },
    needsRAG: { type: "boolean" },
    subQueries: {
      type: "array",
      items: { type: "string" },
    },
    // ✅ added metaData to schema
    metaData: {
      type: "object",
      properties: {
        answer: { type: "string" },
        suggestions: { type: "array", items: { type: "string" } },
      },
      required: ["answer", "suggestions"],
    },
  },
  // ✅ metaData in required so Gemini always returns it
  required: ["intent", "refinedQuery", "needsRAG", "metaData"],
};