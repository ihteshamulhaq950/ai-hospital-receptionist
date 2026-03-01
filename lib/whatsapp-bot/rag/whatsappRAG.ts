/**
 * lib/whatsapp-bot/rag/whatsappRAG.ts
 *
 * WhatsApp-optimized RAG pipeline.
 * Differences from web chat version:
 *  - No SSE / streaming / onProgress callbacks
 *  - Returns plain { answer: string } — no suggestions needed
 *  - Hard 30s timeout on every async step
 *  - Single file — no indirection for simplicity
 */

import { callGeminiWithSchema } from '@/lib/ai/googleProvider';
import { getHospitalNamespace } from '@/lib/pinecone/pineconeClient';

// ─── Types (local, no shared types needed) ───────────────────────────────────

type Intent = 'greeting' | 'identity' | 'hospital_info' | 'complex_query' | 'unclear';

interface ClassifiedQuery {
  intent: Intent;
  refinedQuery: string;
  needsRAG: boolean;
  subQueries?: string[];
}

// ─── Schemas (reuse same Gemini structured-output pattern) ───────────────────

const CLASSIFIER_SCHEMA = {
  type: 'object',
  properties: {
    intent:       { type: 'string', enum: ['greeting','identity','hospital_info','complex_query','unclear'] },
    refinedQuery: { type: 'string' },
    needsRAG:     { type: 'boolean' },
    subQueries:   { type: 'array', items: { type: 'string' } },
  },
  required: ['intent', 'refinedQuery', 'needsRAG'],
};

const ANSWER_SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
  },
  required: ['answer'],
};

// ─── Helper: race any promise against a timeout ───────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error(`[WA RAG] Timeout: ${label} exceeded ${ms}ms`)), ms)
    ),
  ]);
}

// ─── Step 1: Classify ─────────────────────────────────────────────────────────

const CLASSIFIER_PROMPT = (query: string) => `
You are a multilingual query classifier for a hospital information system.

Rules:
- Translate non-English input to English first
- refinedQuery must always be in English, optimized for semantic search
- Output STRICT JSON only

Intent categories:
- greeting   → hi/hello/salam             → needsRAG: false
- identity   → who are you / what can you do → needsRAG: false
- hospital_info → single hospital question → needsRAG: true
- complex_query → multiple questions      → needsRAG: true, split into subQueries
- unclear    → vague / off-topic           → needsRAG: false

User Query: "${query}"

Return JSON:
{
  "intent": "...",
  "refinedQuery": "...",
  "needsRAG": true/false,
  "subQueries": []
}`.trim();

async function classifyQuery(userQuery: string): Promise<ClassifiedQuery> {
  try {
    const result = await withTimeout(
      callGeminiWithSchema<ClassifiedQuery>({
        prompt: CLASSIFIER_PROMPT(userQuery),
        responseSchema: CLASSIFIER_SCHEMA,
        temperature: 0.2,
        maxOutputTokens: 256,
      }),
      8_000,
      'classify'
    );

    return {
      intent:       result.intent       ?? 'hospital_info',
      refinedQuery: result.refinedQuery ?? userQuery.trim(),
      needsRAG:     result.needsRAG     ?? true,
      subQueries:   Array.isArray(result.subQueries) && result.subQueries.length > 0
                      ? result.subQueries
                      : undefined,
    };
  } catch {
    // Pattern-based fallback — zero AI cost
    const lower = userQuery.toLowerCase().trim();
    if (/^(hi|hello|hey|salam|assalam)/i.test(lower))
      return { intent: 'greeting',      refinedQuery: userQuery, needsRAG: false };
    if (/who are you|what can you/i.test(lower))
      return { intent: 'identity',      refinedQuery: userQuery, needsRAG: false };
    if (/\band\b/.test(lower) || (lower.match(/\?/g) ?? []).length > 1)
      return { intent: 'complex_query', refinedQuery: userQuery, needsRAG: true, subQueries: [userQuery] };
    return   { intent: 'hospital_info', refinedQuery: userQuery, needsRAG: true };
  }
}

// ─── Step 2: Vector search ────────────────────────────────────────────────────

async function searchPinecone(
  queries: string[],
  topK: number
): Promise<string> {
  const namespace = getHospitalNamespace();
  const seenIds   = new Set<string>();
  const allHits:  any[] = [];

  await Promise.allSettled(
    queries.map(async (query) => {
      try {
        const res  = await withTimeout(
          namespace.searchRecords({ query: { topK, inputs: { text: query } }, fields: ['text'] }),
          10_000,
          `pinecone:${query.slice(0, 30)}`
        );
        const hits = res?.result?.hits ?? [];
        for (const hit of hits) {
          if (!seenIds.has(hit._id)) {
            seenIds.add(hit._id);
            allHits.push(hit);
          }
        }
      } catch (err) {
        console.error('[WA RAG] Pinecone query failed:', err);
      }
    })
  );

  if (!allHits.length) return '';

  return allHits
    .sort((a, b) => (b._score ?? 0) - (a._score ?? 0))
    .slice(0, topK * 2)                          // cap results
    .map((hit, i) => `[${i + 1}] ${hit.fields?.text ?? ''}`)
    .join('\n\n');
}

// ─── Step 3: Generate answer ──────────────────────────────────────────────────

const ANSWER_PROMPT = (query: string, context: string) =>
  context
    ? `You are a hospital information assistant replying via WhatsApp.
Answer the question using ONLY the context below. Be concise (max 8 lines).
Do NOT add bullet points or markdown — plain text only for WhatsApp.

Context:
${context}

Question: ${query}

Return JSON: { "answer": "..." }`
    : `You are a hospital information assistant replying via WhatsApp.
No relevant information was found for this question. Politely say so in 1-2 sentences.
Suggest the user ask about: timings, departments, appointments, or location.
Plain text only — no markdown.

Question: ${query}

Return JSON: { "answer": "..." }`;

async function generateAnswer(query: string, context: string): Promise<string> {
  try {
    const result = await withTimeout(
      callGeminiWithSchema<{ answer: string }>({
        prompt: ANSWER_PROMPT(query, context),
        responseSchema: ANSWER_SCHEMA,
        temperature: 0.5,
        maxOutputTokens: 512,
      }),
      15_000,
      'generate'
    );
    return result.answer?.trim() || FALLBACK_ANSWER;
  } catch {
    return context
      ? `Here's what I found:\n\n${context.slice(0, 600)}`
      : FALLBACK_ANSWER;
  }
}

// ─── Static non-RAG responses ─────────────────────────────────────────────────

const STATIC_RESPONSES: Record<string, string> = {
  greeting: "Hello! 👋 I'm your hospital information assistant. Ask me about timings, departments, appointments, services, or location.",
  identity: "I'm a hospital information assistant. I can help you with services, timings, departments, doctors, appointments, and more. What would you like to know?",
  unclear:  "I'm not sure I understood that. I can help with hospital timings, departments, appointments, and services. Could you rephrase your question?",
};

const FALLBACK_ANSWER = "I'm having trouble answering right now. Please try again or contact the hospital directly.";

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * WhatsApp RAG entry point.
 * Returns a single plain-text answer string — no suggestions, no streaming.
 */
export async function getWhatsAppAnswer(userMessage: string): Promise<string> {
  console.log('[WA RAG] Query:', userMessage);

  try {
    // 1. Classify
    const classified = await classifyQuery(userMessage);
    console.log('[WA RAG] Intent:', classified.intent, '| needsRAG:', classified.needsRAG);

    // 2. Static response (no Pinecone / LLM cost)
    if (!classified.needsRAG) {
      return STATIC_RESPONSES[classified.intent] ?? STATIC_RESPONSES.unclear;
    }

    // 3. Vector search
    const queries  = classified.subQueries?.length
      ? classified.subQueries
      : [classified.refinedQuery];

    const context  = await searchPinecone(queries, 3);
    console.log('[WA RAG] Context chars:', context.length);

    // 4. Generate answer
    const answer = await generateAnswer(userMessage, context);
    console.log('[WA RAG] Done. Answer length:', answer.length);

    return answer;

  } catch (err) {
    console.error('[WA RAG] Fatal error:', err);
    return FALLBACK_ANSWER;
  }
}