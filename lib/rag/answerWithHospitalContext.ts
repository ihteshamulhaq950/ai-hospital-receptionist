// lib/rag/answerWithHospitalContext.ts

import { ContextUsedItem, AnswerWithContextParams, AnswerWithContextResult } from "@/types/rag";
import { classifyAndRefineQuery } from "./queryClassifier";
import { enhancedRAGSearch } from "./enhancedRag";
import { generateAgenticAnswer } from "./agenticAnswerGenerator";

export async function answerWithHospitalContext({
  content,
  namespace,
  generateAnswer,
  topK = 3,
}: AnswerWithContextParams): Promise<AnswerWithContextResult> {
  try {
    // STEP 1: Classify and refine the query
    const classifiedQuery = await classifyAndRefineQuery(
      content,
      async (prompt) => {
        const result = await generateAnswer(prompt, "");
        return result.answer;
      }
    );

    console.log("Classified query:", classifiedQuery);

    // STEP 2: Determine if RAG is needed
    if (!classifiedQuery.needsRAG) {
      const assistantContent = await generateAgenticAnswer({
        userQuery: content,
        context: "",
        intent: classifiedQuery.intent,
        llmFunction: generateAnswer,
      });

      return {
        assistantContent,
        contextUsed: [],
      };
    }

    // STEP 3: Perform RAG search (with sub-queries if complex)
    const queriesToSearch = classifiedQuery.subQueries && classifiedQuery.subQueries.length > 0
      ? classifiedQuery.subQueries
      : [classifiedQuery.refinedQuery];

    const { context, contextUsed } = await enhancedRAGSearch({
      queries: queriesToSearch,
      namespace,
      topK,
    });

    // STEP 4: Generate final answer
    const assistantContent = await generateAgenticAnswer({
      userQuery: content,
      context,
      intent: classifiedQuery.intent,
      llmFunction: generateAnswer,
    });

    console.log("Final response:", { assistantContent, contextUsed });

    return {
      assistantContent,
      contextUsed,
    };
  } catch (error) {
    console.error("Agentic RAG error:", error);

    return {
      assistantContent: {
        answer: "I'm experiencing technical difficulties. Please try again in a moment.",
        suggestions: [],
      },
      contextUsed: [],
    };
  }
}



// import { ContextUsedItem, AnswerWithContextParams, AnswerWithContextResult } from "@/types/rag";

// export async function answerWithHospitalContext({
//   content,
//   namespace,
//   generateAnswer,
//   topK = 2,
// }: AnswerWithContextParams): Promise<AnswerWithContextResult> {
//   let contextUsed: ContextUsedItem[];
//   try {
//     const searchResult = await namespace.searchRecords({
//       query: {
//         topK,
//         inputs: { text: content },
//       },
//       fields: ["text", "page"],
//     });

//     const hits = searchResult?.result?.hits ?? [];
//     console.log("hits from pinecone db:", hits);

//     // No context found: call generateAnswer with empty string
//     if (hits.length === 0) {
//       const assistantContent = await generateAnswer(content, "");
//       return {
//         assistantContent,
//         contextUsed: [],
//       };
//     }

//     // Build context string from Pinecone hits
//     const context = hits
//       .map((hit, i) => `Source ${i + 1}:\n${hit.fields?.text ?? ""}`)
//       .join("\n\n");

//     // Get answer + suggestions from LLM
//     const assistantContent = await generateAnswer(content, context);
//     console.log("assistantContent from Gemini:", assistantContent);

//     contextUsed = hits.map((hit) => ({
//       id: hit._id,
//       score: hit._score,
//       page: hit.fields?.page ?? null,
//     }));

//     console.log("{assistantContent, contextUsed} is:", { assistantContent, contextUsed })

//     return { assistantContent, contextUsed };
//   } catch (error) {
//     console.error("RAG utility error:", error);

//     return {
//       assistantContent: {
//         answer: "I’m having trouble accessing knowledge sources right now.",
//         suggestions: [],
//       },
//       contextUsed: [],
//     };
//   }
// }
