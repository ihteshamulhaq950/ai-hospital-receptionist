// FINAL STREAM API - CLEAN & MODULAR
// app/api/chat/stream/route.ts

import { NextRequest, NextResponse } from "next/server";
import { answerWithHospitalContext } from "@/lib/rag/answerWithHospitalContext";
import { getHospitalNamespace } from "@/lib/pinecone/pineconeClient";
import { createSSEResponse } from "@/lib/utils/sse";
import { getChatAuth } from "@/lib/auth/chatAuth";
import type { AssistantContent } from "@/types/chat";
import type { AnswerWithContextResult } from "@/types/rag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const { stream, sendEvent, close } = createSSEResponse();

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

      // ─── 3. Save user message (fire & forget) ───
      supabase
        .from("chat_messages")
        .insert({
          chat_session_id: chatSessionId,
          role: "user",
          content_text: content.trim(),
          content_json: [],
        })
        .then(({ error }) => {
          if (error) console.error("[Stream API] Failed to save user message:", error);
        });

      // ─── 4. AGENTIC RAG FLOW WITH PROGRESS ───
      let assistantContent: AssistantContent = {
        answer: "I'm having trouble right now. Please try again shortly.",
        suggestions: [],
      };
      let contextUsed: unknown[] = [];
      let queryIntent: string = "unknown";

      try {
        console.log("[Stream API] Processing query:", content);

        // Call the modular agentic RAG system
        const result = await answerWithHospitalContext({
          content: content.trim(),
          namespace: getHospitalNamespace(),
          topK: 3,
          onProgress: (stage, details) => {
            // Real-time progress updates
            switch (stage) {
              case "classifying":
                sendEvent("progress", { 
                  step: 1, 
                  message: "Understanding your question...", 
                  status: "processing",
                  details: details?.intent 
                });
                if (details?.intent) {
                  queryIntent = details.intent;
                }
                break;
              
              case "searching":
                const searchMsg = details?.subQueries 
                  ? `Searching for: ${details.subQueries.join(", ")}`
                  : "Searching hospital knowledge base...";
                
                sendEvent("progress", { 
                  step: 2, 
                  message: searchMsg, 
                  status: "processing",
                  details: {
                    isComplex: details?.isComplex,
                    queryCount: details?.subQueries?.length || 1
                  }
                });
                break;
              
              case "generating":
                sendEvent("progress", { 
                  step: 3, 
                  message: "Generating answer...", 
                  status: "processing",
                  details: {
                    type: details?.type,
                    sourcesFound: details?.sources_found
                  }
                });
                break;
              
              case "complete":
                sendEvent("progress", { 
                  step: 4, 
                  message: "Answer ready", 
                  status: "completed",
                  details: {
                    usedRAG: details?.used_rag,
                    sources: details?.sources
                  }
                });
                break;

              case "error":
                sendEvent("progress", {
                  step: 4,
                  message: "Encountered an issue, using fallback",
                  status: "warning"
                });
                break;
            }
          }
        }) as AnswerWithContextResult;

        assistantContent = {
          ...result.assistantContent,
          suggestions: result.assistantContent.suggestions ?? [],
        };
        contextUsed = result.contextUsed ?? [];

        console.log("[Stream API] Success - Intent:", queryIntent, "Sources:", contextUsed.length);

      } catch (err) {
        console.error("[Stream API] Agentic RAG failed:", err);
        
        sendEvent("progress", { 
          step: 4, 
          message: "Using fallback response", 
          status: "warning" 
        });
        
        // Intelligent fallback
        assistantContent = {
          answer: "I'm experiencing technical difficulties right now. Please try asking your question again, or try one of these common topics:",
          suggestions: [
            "What are the OPD timings?",
            "How do I book an appointment?",
            "What departments are available?",
            "What is the hospital address?",
          ],
        };
      }

      // ─── 5. Stream answer to client ───
      sendEvent("assistant_response", {
        content_text: assistantContent.answer ?? "",
        content_json: assistantContent.suggestions ?? [],
        context_used: contextUsed,
        metadata: {
          query_intent: queryIntent,
          used_rag: contextUsed.length > 0,
          sources_count: contextUsed.length,
          timestamp: new Date().toISOString(),
        },
      });
//           context_used: contextUsed,
      // ─── 6. Save assistant message with metadata ───
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
            await supabase.rpc("increment_message_count", { 
              session_id: chatSessionId 
            });
            console.log("[Stream API] Message saved successfully");
          } else {
            console.error("[Stream API] Failed to save assistant message:", error);
          }
        });

      // ─── 7. Complete ───
      sendEvent("complete", { 
        success: true,
        metadata: {
          query_intent: queryIntent,
          sources_used: contextUsed.length,
          timestamp: new Date().toISOString(),
        }
      });
      
      close();

    } catch (err) {
      console.error("[Stream API] Critical failure:", err);
      sendEvent("error", { 
        message: "Internal server error. Please try again.",
        timestamp: new Date().toISOString(),
      });
      close();
    }
  })();

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// // /api/chat/stream/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { answerWithHospitalContext } from "@/lib/rag/answerWithHospitalContext";
// import { generateHospitalAnswer } from "@/lib/ai/googleProvider";
// import { getHospitalNamespace } from "@/lib/pinecone/pineconeClient";
// import { createSSEResponse } from "@/lib/utils/sse";
// import { getChatAuth } from "@/lib/auth/chatAuth";
// import type { AssistantContent } from "@/types/chat";
// import type { AnswerWithContextResult } from "@/types/rag";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";     // ← good practice for streaming
// export const maxDuration = 45;               // ← prevent hanging (Vercel default 10s)

// export async function POST(req: NextRequest) {
//   const { stream, sendEvent, close } = createSSEResponse();

//   // Run the whole logic in background (detached from response)
//   (async () => {
//     try {
//       // ─── 1. Parse & validate input ───
//       const body = await req.json().catch(() => ({}));
//       const { content, chatSessionId } = body;

//       if (typeof content !== "string" || !content.trim()) {
//         sendEvent("error", { message: "Message content is required" });
//         close();
//         return;
//       }

//       if (!chatSessionId || typeof chatSessionId !== "string") {
//         sendEvent("error", { message: "Valid chat session ID is required" });
//         close();
//         return;
//       }

//       sendEvent("progress", { step: 1, message: "Processing...", status: "processing" });

//       // ─── 2. Authentication & authorization ───
//       const auth = await getChatAuth();
//       if (!auth.success) {
//         sendEvent("error", {
//           message: auth.error,
//           status: auth.rateLimited ? 429 : 401,
//         });
//         close();
//         return;
//       }

//       const { user, supabase } = auth;

//       // Quick ownership check
//       const { data: session, error: sessionErr } = await supabase
//         .from("chat_sessions")
//         .select("id")
//         .eq("id", chatSessionId)
//         .eq("user_id", user.sub)
//         .single();

//       if (sessionErr || !session) {
//         sendEvent("error", { message: "Chat session not found or access denied" });
//         close();
//         return;
//       }

//       // ─── 3. Save user message (fire & forget style) ───
//       supabase
//         .from("chat_messages")
//         .insert({
//           chat_session_id: chatSessionId,
//           role: "user",
//           content_text: content.trim(),
//           content_json: [],
//         })
//         .then(({ error }) => {
//           if (error) console.error("Failed to persist user message:", error);
//         });

//       // ─── 4. RAG + Generation ───
//       sendEvent("progress", { step: 2, message: "Searching hospital knowledge...", status: "processing" });

//       let assistantContent: AssistantContent = {
//         answer: "I'm having trouble right now. Please try again shortly.",
//         suggestions: [],
//       };

//       let contextUsed: unknown[] = [];

//       try {
//         const result = await answerWithHospitalContext({
//           content: content.trim(),
//           namespace: getHospitalNamespace(),
//           generateAnswer: generateHospitalAnswer,
//         }) as AnswerWithContextResult;

//         assistantContent = {
//           ...result.assistantContent,
//           suggestions: result.assistantContent.suggestions ?? [],
//         };

//         contextUsed = result.contextUsed ?? [];

//         sendEvent("progress", { step: 2, message: "Answer ready", status: "completed" });
//       } catch (err) {
//         console.error("RAG / generation failed:", err);
//         sendEvent("progress", { step: 2, message: "Using fallback answer", status: "warning" });
//       }

//       // ─── 5. Stream answer to client ───
//       sendEvent("assistant_response", {
//         content_text: assistantContent.answer ?? "",
//         content_json: assistantContent.suggestions ?? [],
//         context_used: contextUsed,
//       });

//       // ─── 6. Save assistant message (fire & forget + count) ───
//       supabase
//         .from("chat_messages")
//         .insert({
//           chat_session_id: chatSessionId,
//           role: "assistant",
//           content_text: assistantContent.answer ?? "",
//           content_json: assistantContent.suggestions ?? [],
//           context_used: contextUsed,
//         })
//         .then(async ({ error }) => {
//           if (!error) {
//             await supabase.rpc("increment_message_count", { session_id: chatSessionId });
//           } else {
//             console.error("Failed to save assistant message:", error);
//           }
//         });

//       // ─── Done ───
//       sendEvent("complete", { success: true });
//       close();
//     } catch (err) {
//       console.error("[stream-api] Critical failure:", err);
//       sendEvent("error", { message: "Internal server error" });
//       close();
//     }
//   })();

//   return new NextResponse(stream, {
//     status: 200,
//     headers: {
//       "Content-Type": "text/event-stream",
//       "Cache-Control": "no-cache, no-transform",
//       Connection: "keep-alive",
//       "X-Accel-Buffering": "no",           // ← important for nginx reverse proxy
//     },
//   });
// }
