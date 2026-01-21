// lib/rag/enhancedRAG.ts

import { ContextUsedItem } from "@/types/rag";

interface RAGResult {
  answer: string;
  suggestions: string[];
  contextUsed: ContextUsedItem[];
}

export async function enhancedRAGSearch({
  queries,
  namespace,
  topK = 3,
}: {
  queries: string[];
  namespace: any;
  topK?: number;
}): Promise<{ context: string; contextUsed: ContextUsedItem[] }> {
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
        fields: ["text", "page"],
      });

      const hits = searchResult?.result?.hits ?? [];
      
      // Deduplicate by ID
      for (const hit of hits) {
        if (!seenIds.has(hit._id)) {
          seenIds.add(hit._id);
          allHits.push(hit);
        }
      }
    } catch (error) {
      console.error(`Search failed for query "${query}":`, error);
    }
  }

  // Sort by score and take top results
  allHits.sort((a, b) => (b._score ?? 0) - (a._score ?? 0));
  const topHits = allHits.slice(0, topK * 2); // Allow more context for complex queries

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
