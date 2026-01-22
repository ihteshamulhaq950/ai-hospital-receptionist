// AGENTIC ANSWER GENERATOR (uses generic Google Provider)
// lib/rag/agenticAnswerGenerator.ts

import { callGeminiWithSchema } from "@/lib/ai/googleProvider";
import { QueryIntent } from "@/lib/rag/queryClassifier";
import { HospitalAnswer } from "@/types/rag";


const ANSWER_GENERATOR_SCHEMA = {
  type: "object",
  properties: {
    answer: {
      type: "string",
      description: "Clear, concise answer based on context or acknowledgment of missing info"
    },
    suggestions: {
      type: "array",
      items: { type: "string" },
      description: "3-5 relevant follow-up questions"
    }
  },
  required: ["answer", "suggestions"]
};

function buildAnswerPrompt(userQuery: string, context: string): string {
  const hasContext = context.trim().length > 0;

  if (hasContext) {
    return `You are a helpful hospital information assistant. Answer the user's question using ONLY the provided context from the hospital's knowledge base.

RULES:
- Be accurate, clear, and concise (maximum 10 lines)
- Use ONLY information from the context provided below
- If the context doesn't fully answer the question, acknowledge what's missing
- Format the answer in a friendly, professional manner
- Provide 3-4 relevant follow-up question suggestions based on the context
- DO NOT make up information or hallucinate details

Context:
${context}

User Question: ${userQuery}

Output JSON format:
{
  "answer": "your detailed answer here based on context",
  "suggestions": ["follow-up question 1", "follow-up question 2", "follow-up question 3"]
}`;
  }

  return `You are a helpful hospital information assistant. The user asked a question but no relevant information was found in the knowledge base.

User Question: ${userQuery}

RULES:
- Politely acknowledge you don't have that specific information
- Provide 4-5 helpful alternative questions about common hospital topics
- Questions should be semantic and AI-driven, expanding on what the user might need
- Topics to suggest: address, timings, services, departments, appointments, emergencies, facilities

Output JSON format:
{
  "answer": "polite response acknowledging you don't have specific info about their question",
  "suggestions": ["helpful question 1", "helpful question 2", "helpful question 3", "helpful question 4"]
}`;
}

export async function generateAnswer(
  userQuery: string,
  context: string
): Promise<HospitalAnswer> {
  const hasContext = context.trim().length > 0;

  try {
    const result = await callGeminiWithSchema<HospitalAnswer>({
      prompt: buildAnswerPrompt(userQuery, context),
      responseSchema: ANSWER_GENERATOR_SCHEMA,
      temperature: 0.7,
      maxOutputTokens: 1024,
    });

    console.log("[Answer Generator] Success");

    return {
      answer: result.answer ?? "Information not available",
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
    };

  } catch (error) {
    console.error("[Answer Generator] Failed, using fallback:", error);
    return fallbackAnswer(hasContext);
  }
}

function fallbackAnswer(hasContext: boolean): HospitalAnswer {
  return {
    answer: hasContext 
      ? "I found some information but had trouble processing it. Please try rephrasing your question."
      : "I couldn't find specific information about that in our knowledge base. Please try one of the suggested questions below.",
    suggestions: hasContext 
      ? [
          "What are the hospital operating hours?",
          "How do I book an appointment?",
          "What services are available?"
        ]
      : [
          "What are the OPD timings?",
          "Where is the hospital located?",
          "What departments are available?",
          "How do I contact the hospital?"
        ],
  };
}

export async function generateAgenticAnswer({
  userQuery,
  context,
  intent,
}: {
  userQuery: string;
  context: string;
  intent: QueryIntent;
}): Promise<{ answer: string; suggestions: string[] }> {
  console.log("[Answer Generator] Intent:", intent, "Has context:", context.length > 0);

  // Handle greetings
  if (intent === "greeting") {
    return {
      answer: "Hello! I'm your hospital information assistant. I can help you with information about services, timings, departments, doctors, and more. What would you like to know?",
      suggestions: [
        "What are the OPD timings?",
        "Which departments are available?",
        "How do I book an appointment?",
        "What is the hospital address?",
      ],
    };
  }

  // Handle identity questions
  if (intent === "identity") {
    return {
      answer: "I'm a hospital information assistant designed to help you find accurate information about our hospital services, facilities, timings, departments, and procedures. I have access to our hospital's knowledge base and can answer your questions quickly and accurately. How can I assist you today?",
      suggestions: [
        "Show me emergency services",
        "What are the visiting hours?",
        "Tell me about available specialists",
        "How do I get lab reports?",
      ],
    };
  }

  // Handle unclear queries without context
  if (intent === "unclear" && !context) {
    return {
      answer: "I'm not quite sure what you're asking about. I specialize in hospital information. Could you please clarify your question? I can help you with topics like services, timings, departments, procedures, and facilities.",
      suggestions: [
        "What services does the hospital offer?",
        "How do I contact the hospital?",
        "What are the consultation fees?",
        "Is there a pharmacy available?",
      ],
    };
  }

  // No context found for hospital query
  if (!context) {
    return {
      answer: "I couldn't find specific information about that in our knowledge base. However, I can help you with many other hospital-related questions. Here are some common topics:",
      suggestions: [
        "Hospital address and contact details",
        "OPD and emergency timings",
        "Available medical departments",
        "Appointment booking process",
      ],
    };
  }

  // Use generic Google Provider to generate answer with RAG context
  return await generateAnswer(userQuery, context);
}