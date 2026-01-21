// /api/chat/stream/route.ts
import { NextRequest, NextResponse } from "next/server";
import { answerWithHospitalContext } from "@/lib/rag/answerWithHospitalContext";
import { generateHospitalAnswer } from "@/lib/ai/googleProvider";
import { getHospitalNamespace } from "@/lib/pinecone/pineconeClient";
import { createSSEResponse } from "@/lib/utils/sse";
import { getChatAuth } from "@/lib/auth/chatAuth";
import type { AssistantContent } from "@/types/chat";
import type { AnswerWithContextResult } from "@/types/rag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";     // ← good practice for streaming
export const maxDuration = 45;               // ← prevent hanging (Vercel default 10s)

export async function POST(req: NextRequest) {
  const { stream, sendEvent, close } = createSSEResponse();

  // Run the whole logic in background (detached from response)
  (async () => {
    try {
      // ─── 1. Parse & validate input ───
      const body = await req.json().catch(() => ({}));
      const { content, chatSessionId } = body;

      if (typeof content !== "string" || !content.trim()) {
        sendEvent("error", { message: "Message content is required" });
        close();
        return;
      }

      if (!chatSessionId || typeof chatSessionId !== "string") {
        sendEvent("error", { message: "Valid chat session ID is required" });
        close();
        return;
      }

      sendEvent("progress", { step: 1, message: "Processing...", status: "processing" });

      // ─── 2. Authentication & authorization ───
      const auth = await getChatAuth();
      if (!auth.success) {
        sendEvent("error", {
          message: auth.error,
          status: auth.rateLimited ? 429 : 401,
        });
        close();
        return;
      }

      const { user, supabase } = auth;

      // Quick ownership check
      const { data: session, error: sessionErr } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("id", chatSessionId)
        .eq("user_id", user.sub)
        .single();

      if (sessionErr || !session) {
        sendEvent("error", { message: "Chat session not found or access denied" });
        close();
        return;
      }

      // ─── 3. Save user message (fire & forget style) ───
      supabase
        .from("chat_messages")
        .insert({
          chat_session_id: chatSessionId,
          role: "user",
          content_text: content.trim(),
          content_json: [],
        })
        .then(({ error }) => {
          if (error) console.error("Failed to persist user message:", error);
        });

      // ─── 4. RAG + Generation ───
      sendEvent("progress", { step: 2, message: "Searching hospital knowledge...", status: "processing" });

      let assistantContent: AssistantContent = {
        answer: "I'm having trouble right now. Please try again shortly.",
        suggestions: [],
      };

      let contextUsed: unknown[] = [];

      try {
        const result = await answerWithHospitalContext({
          content: content.trim(),
          namespace: getHospitalNamespace(),
          generateAnswer: generateHospitalAnswer,
        }) as AnswerWithContextResult;

        assistantContent = {
          ...result.assistantContent,
          suggestions: result.assistantContent.suggestions ?? [],
        };

        contextUsed = result.contextUsed ?? [];

        sendEvent("progress", { step: 2, message: "Answer ready", status: "completed" });
      } catch (err) {
        console.error("RAG / generation failed:", err);
        sendEvent("progress", { step: 2, message: "Using fallback answer", status: "warning" });
      }

      // ─── 5. Stream answer to client ───
      sendEvent("assistant_response", {
        content_text: assistantContent.answer ?? "",
        content_json: assistantContent.suggestions ?? [],
        context_used: contextUsed,
      });

      // ─── 6. Save assistant message (fire & forget + count) ───
      supabase
        .from("chat_messages")
        .insert({
          chat_session_id: chatSessionId,
          role: "assistant",
          content_text: assistantContent.answer ?? "",
          content_json: assistantContent.suggestions ?? [],
          context_used: contextUsed,
        })
        .then(async ({ error }) => {
          if (!error) {
            await supabase.rpc("increment_message_count", { session_id: chatSessionId });
          } else {
            console.error("Failed to save assistant message:", error);
          }
        });

      // ─── Done ───
      sendEvent("complete", { success: true });
      close();
    } catch (err) {
      console.error("[stream-api] Critical failure:", err);
      sendEvent("error", { message: "Internal server error" });
      close();
    }
  })();

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",           // ← important for nginx reverse proxy
    },
  });
}
