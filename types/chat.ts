// types/chat.ts

interface ContextSource {
    id: string;
    score: number;
    page: number | null;
}

export interface Message {
  id: string;
  chat_session_id: string;
  role: "user" | "assistant";
  content_text: string;   // 🔑 union type
  content_json: string[];
  created_at: string;
  context_used?: ContextSource[];
  user_feedback?: number | null;
  feedback_text?: string | null;
}
