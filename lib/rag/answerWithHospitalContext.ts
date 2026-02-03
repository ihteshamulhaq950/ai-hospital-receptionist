// MAIN AGENTIC RAG FUNCTION
// lib/rag/answerWithHospitalContext.ts

import { ContextUsedItem, AnswerWithContextParams, AnswerWithContextResult } from "@/types/rag";
import { classifyAndRefineQuery } from "./queryClassifier";
import { enhancedRAGSearch } from "./enhancedRAG";
import { generateAgenticAnswer } from "./agenticAnswerGenerator";

export interface AgenticRAGParams extends Omit<AnswerWithContextParams, 'generateAnswer'> {
  onProgress?: (stage: string, details?: any) => void;
}

export async function answerWithHospitalContext({
  content,
  namespace,
  topK = 3,
  onProgress,
}: AgenticRAGParams): Promise<AnswerWithContextResult> {
  try {
    // STEP 1: Classify and refine the query
    onProgress?.("classifying", { query: content });
    console.log("[Agentic RAG] Starting for query:", content);
    
    const classifiedQuery = await classifyAndRefineQuery(content);

    console.log("[Agentic RAG] Classified:", classifiedQuery);
    onProgress?.("classifying", { 
      intent: classifiedQuery.intent,
      needsRAG: classifiedQuery.needsRAG,
      refined: classifiedQuery.refinedQuery,
    });

    // STEP 2: Handle non-RAG queries immediately
    if (!classifiedQuery.needsRAG) {
      onProgress?.("generating", { type: "direct_response" });
      console.log("[Agentic RAG] Direct response (no RAG needed)");
      
      const assistantContent = await generateAgenticAnswer({
        userQuery: content,
        context: "",
        intent: classifiedQuery.intent,
      });

      onProgress?.("complete", { used_rag: false });

      return {
        assistantContent,
        contextUsed: [],
      };
    }

    // STEP 3: Perform RAG search with sub-queries
    const queriesToSearch = classifiedQuery.subQueries?.length 
      ? classifiedQuery.subQueries
      : [classifiedQuery.refinedQuery];

    onProgress?.("searching", { 
      subQueries: queriesToSearch,
      isComplex: queriesToSearch.length > 1 
    });
    console.log("[Agentic RAG] Searching for:", queriesToSearch);

    const { context, contextUsed } = await enhancedRAGSearch({
      queries: queriesToSearch,
      namespace,
      topK,
    });

    console.log(`[Agentic RAG] Found ${contextUsed.length} relevant sources`);

    // STEP 4: Generate final answer
    onProgress?.("generating", { 
      type: "rag_response",
      sources_found: contextUsed.length 
    });

    const assistantContent = await generateAgenticAnswer({
      userQuery: content,
      context,
      intent: classifiedQuery.intent,
    });

    onProgress?.("complete", { 
      used_rag: true,
      sources: contextUsed.length 
    });

    console.log("[Agentic RAG] Complete - Intent:", classifiedQuery.intent, "Sources:", contextUsed.length);

    return {
      assistantContent,
      contextUsed,
    };

  } catch (error) {
    console.error("[Agentic RAG] Error:", error);
    onProgress?.("error", { error: String(error) });

    return {
      assistantContent: {
        answer: "I'm experiencing technical difficulties. Please try again in a moment.",
        suggestions: [
          "What are the hospital timings?",
          "How can I contact the hospital?",
          "What services are available?",
        ],
      },
      contextUsed: [],
    };
  }
}
