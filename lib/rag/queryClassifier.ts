// lib/rag/queryClassifier.ts
import { callGeminiWithSchema } from "../ai/googleProvider";
import { ClassifiedQuery, QUERY_CLASSIFIER_SCHEMA } from "@/types/rag";

const CLASSIFIER_SYSTEM_PROMPT = `
You are a multilingual query classifier for a hospital assistant.

TASK
1. Detect intent
2. Translate non-English queries to English
3. Rewrite query for semantic hospital search if RAG is needed
4. Only generate answers when intent = "medical_guidance"

SUPPORTED INTENTS
- greeting
- identity
- hospital_info
- complex_query
- medical_guidance
- unclear

LANGUAGE RULE
If the query is Urdu or another language, translate it to English first.
Always output refinedQuery in English.

-------------------------------------
RAG QUERY REWRITE (when needsRAG=true)
Rewrite queries to match hospital documentation:
- Expand abbreviations (OPD → Outpatient Department)
- Correct grammar
- Use formal hospital terminology
- Convert vague queries into structured questions

Example:
"Where do I register?"
→ "What is the patient registration process and where is the registration counter located?"

-------------------------------------
MEDICAL GUIDANCE (DIRECT RESPONSE)
If the user describes symptoms or asks which doctor to see:

Examples: "ear pain", "I have chest pain", "skin allergy", "my child has fever"

Classify as: intent = "medical_guidance", needsRAG = false, refinedQuery = "", subQueries = []

Specialist mappings:
Ear → ENT | Chest → Cardiologist | Skin → Dermatologist | Child illness → Pediatrician
Eye → Ophthalmologist | Bone/joint → Orthopedic | Stomach → Gastroenterologist

REQUIRED output shape for medical_guidance:
{
  "intent": "medical_guidance",
  "refinedQuery": "",
  "needsRAG": false,
  "subQueries": [],
  "metaData": {
    "answer": "For ear related symptoms you should consult an ENT specialist.",
    "suggestions": [
      "Are ENT specialists available today?",
      "How can I book an ENT appointment?",
      "What are ENT department timings?",
      "Where is the ENT department located?",
      "What conditions does the ENT department treat?"
    ]
  }
}

-------------------------------------
INTENT RULES
greeting       → needsRAG=false
identity       → needsRAG=false
hospital_info  → needsRAG=true
complex_query  → needsRAG=true, split into subQueries
unclear        → needsRAG=false

-------------------------------------
OUTPUT RULES
- medical_guidance → MUST include metaData (answer + exactly 5 suggestions)
- ALL other intents → MUST NOT include metaData field at all
- Return STRICT JSON only. No markdown, no explanations.
`.trim();

function buildClassifierPrompt(userQuery: string): string {
  return `${CLASSIFIER_SYSTEM_PROMPT}

User Query: "${userQuery}"

Return JSON using the correct shape for the detected intent:

If medical_guidance:
{
  "intent": "medical_guidance",
  "refinedQuery": "",
  "needsRAG": false,
  "subQueries": [],
  "metaData": { "answer": "...", "suggestions": ["...x5"] }
}

All other intents:
{
  "intent": "greeting|identity|hospital_info|complex_query|unclear",
  "refinedQuery": "optimized English query",
  "needsRAG": true|false,
  "subQueries": ["only for complex_query, else empty array"]
}

Return STRICT JSON only.`.trim();
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
      maxOutputTokens: 1024,
    });

    console.log("[AI Classifier] Result:", result);

    return {
      intent: result.intent ?? "hospital_info",
      refinedQuery: result.refinedQuery ?? userQuery.trim(),
      needsRAG: result.needsRAG ?? true,
      subQueries:
        Array.isArray(result.subQueries) && result.subQueries.length > 0
          ? result.subQueries
          : undefined,
      // ✅ pass metaData through for medical_guidance
      metaData: result.metaData?.answer
        ? {
            answer: result.metaData.answer,
            suggestions: result.metaData.suggestions ?? [],
          }
        : undefined,
    };
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
    console.warn(
      "[Query Classifier] AI classification failed, using pattern-based fallback:",
      error,
    );
    const fallbackResult = classifyWithPatterns(userQuery);
    return fallbackResult;
  }
}
