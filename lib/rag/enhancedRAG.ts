// ENHANCED RAG SEARCH (no LLM needed - pure vector search)
// lib/rag/enhancedRAG.ts

import { ContextUsedItem } from "@/types/rag";

export async function enhancedRAGSearch({
  queries,
  namespace,
  topK = 3,
}: {
  queries: string[];
  namespace: any;
  topK?: number;
}): Promise<{ context: string; contextUsed: ContextUsedItem[] }> {
  console.log("[RAG Search] Queries:", queries);
  
  const allHits: any[] = [];
  const seenIds = new Set<string>();

  // Search for each sub-query
  for (const query of queries) {
    try {
      const searchResult = await namespace.searchRecords({
        query: {
          topK,
          inputs: { text: query },
        },
        fields: ["text"],
      });

      const hits = searchResult?.result?.hits ?? [];
      console.log(`[RAG Search] Found ${hits.length} hits for "${query}"`);
      
      // Deduplicate by ID
      for (const hit of hits) {
        if (!seenIds.has(hit._id)) {
          seenIds.add(hit._id);
          allHits.push(hit);
        }
      }
    } catch (error) {
      console.error(`[RAG Search] Failed for query "${query}":`, error);
    }
  }

  // Sort by relevance score
  allHits.sort((a, b) => (b._score ?? 0) - (a._score ?? 0));
  
  // Take top results (allow more for complex queries)
  const maxResults = Math.min(topK * Math.max(queries.length, 2), 10);
  const topHits = allHits.slice(0, maxResults);

  console.log(`[RAG Search] Returning ${topHits.length} total hits`);

  if (topHits.length === 0) {
    return { context: "", contextUsed: [] };
  }

  const context = topHits
    .map((hit, i) => `Source ${i + 1}:\n${hit.fields?.text ?? ""}`)
    .join("\n\n");

  const contextUsed = topHits.map((hit) => ({
    id: hit._id,
    score: hit._score,
    page: hit.fields?.page ?? null,
  }));

  return { context, contextUsed };
}