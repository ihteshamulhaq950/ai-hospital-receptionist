// lib/rag/agenticAnswerGenerator.ts
import { QueryIntent } from "./queryClassifier";

export async function generateAgenticAnswer({
  userQuery,
  context,
  intent,
  llmFunction,
}: {
  userQuery: string;
  context: string;
  intent: QueryIntent;
  llmFunction: (prompt: string, context: string) => Promise<any>;
}): Promise<{ answer: string; suggestions: string[] }> {
  // Handle non-RAG intents directly
  if (intent === "greeting") {
    return {
      answer: "Hello! I'm your hospital information assistant. I can help you with information about services, timings, departments, and more. What would you like to know?",
      suggestions: [
        "What are the OPD timings?",
        "Which departments are available?",
        "How do I book an appointment?",
      ],
    };
  }

  if (intent === "identity") {
    return {
      answer: "I'm a hospital information assistant designed to help you find information about hospital services, facilities, timings, departments, and procedures. I have access to the hospital's knowledge base and can answer your questions accurately.",
      suggestions: [
        "Show me emergency services",
        "What are visiting hours?",
        "Tell me about available specialists",
      ],
    };
  }

  if (intent === "unclear" && !context) {
    return {
      answer: "I'm not quite sure what you're asking about. Could you please clarify? I can help you with hospital services, timings, departments, procedures, and facilities.",
      suggestions: [
        "What services does the hospital offer?",
        "How do I contact the hospital?",
        "What are the consultation fees?",
      ],
    };
  }

  // For hospital_info and complex_query: use RAG
  if (!context) {
    return {
      answer: "I couldn't find specific information about that in our knowledge base. Here are some common topics I can help with:",
      suggestions: [
        "Hospital address and contact details",
        "OPD and emergency timings",
        "Available medical departments",
        "Appointment booking process",
      ],
    };
  }

  // Generate answer with context
  return await llmFunction(userQuery, context);
}
