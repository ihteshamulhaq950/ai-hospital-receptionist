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
