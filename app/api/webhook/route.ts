/**
 * app/api/whatsapp/webhook/route.ts
 */

import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getWhatsAppAnswer,
  WhatsAppRAGResult,
} from "@/lib/whatsapp-bot/rag/whatsappRAG";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
const PHONE_NUM_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const WA_MESSAGES = `https://graph.facebook.com/v25.0/${PHONE_NUM_ID}/messages`;
const WA_HEADERS = {
  Authorization: `Bearer ${ACCESS_TOKEN}`,
  "Content-Type": "application/json",
} as const;

// ─── GET: Webhook verification ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const ok =
    p.get("hub.mode") === "subscribe" &&
    p.get("hub.verify_token") === VERIFY_TOKEN;

  return ok
    ? new NextResponse(p.get("hub.challenge"), { status: 200 })
    : new NextResponse("Forbidden", { status: 403 });
}

// ─── POST: Receive messages ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  console.log("📞 [WA Webhook] Received event:", body);

  // Always 200 — WhatsApp retries anything else and floods the endpoint
  if (body?.object !== "whatsapp_business_account") {
    return NextResponse.json({ status: "ignored" });
  }

  // Extract ONLY plain text messages.
  // Every other type (image, audio, video, document, sticker,
  // location, reaction, status update) is silently ignored — still 200.
  const messages: {
    from: string;
    text: string;
    msgId: string;
    name: string;
  }[] = (body.entry ?? [])
    .flatMap((e: any) => e.changes ?? [])
    .filter((c: any) => c.field === "messages")
    .flatMap((c: any) => {
      const { messages = [], contacts = [] } = c.value ?? {};
      return (messages as any[])
        .filter(
          (m) =>
            m.type === "text" && // ← strict: text only
            typeof m.text?.body === "string" &&
            m.text.body.trim().length > 0,
        )
        .map((m) => ({
          from: m.from as string,
          text: (m.text.body as string).trim(),
          msgId: m.id as string,
          name:
            (contacts as any[]).find((c) => c.wa_id === m.from)?.profile
              ?.name ?? "User",
        }));
    });

  // No text messages (file, reaction, status, etc.) — ack and done
  if (!messages.length) {
    return NextResponse.json({ status: "ok" });
  }

  // ✅ Return 200 immediately (< 200ms, well within WhatsApp's 10s window)
  // after() keeps the Vercel function alive until all background work finishes
  after(Promise.allSettled(messages.map(processMessage)));

  return NextResponse.json({ status: "ok" });
}

// ─── Core processor ───────────────────────────────────────────────────────────

async function processMessage(msg: {
  from: string;
  text: string;
  msgId: string;
  name: string;
}): Promise<void> {
  const t0 = Date.now();
  const supabase = await createClient();

  // 1. Mark as read (blue ✓✓) + show typing indicator in one single API call.
  //    This is the official Meta payload — same /messages endpoint,
  //    status:"read" + typing_indicator together marks read AND starts the dots.
  //    Runs fire-and-forget — never blocks RAG if it fails.
  void markReadAndShowTyping(msg.msgId);

  // 2. Persist incoming message
  const { data: row, error } = await supabase
    .from("whatsapp_messages")
    .insert({
      phone_number: msg.from,
      message: msg.text,
      status: "processing",
      metadata: { user_name: msg.name, message_id: msg.msgId },
    })
    .select("id")
    .single();

  if (error || !row) {
    console.error("[WA Webhook] DB insert failed:", error);
    return;
  }

  // 3. Run RAG
  let ragResult: WhatsAppRAGResult = {
    answer: "Sorry, I'm having trouble right now. Please try again shortly.",
    suggestions: [],
  };
  let success = false;

  try {
    ragResult = await getWhatsAppAnswer(msg.text);
    success = true;
  } catch (err) {
    console.error("[WA Webhook] RAG failed:", err);
  }

  const duration = Date.now() - t0;
  const formattedMessage = formatWhatsAppMessage(
    ragResult.answer,
    ragResult.suggestions,
  );

  // 4. Persist response
  await supabase
    .from("whatsapp_messages")
    .update({
      response: ragResult.answer, // store raw answer only
      status: "completed",
      processing_time_ms: duration,
      metadata: {
        user_name: msg.name,
        message_id: msg.msgId,
        success,
        duration_ms: duration,
        suggestions: ragResult.suggestions, // store suggestions separately
      },
    })
    .eq("id", row.id);

  // 5. Send formatted reply with answer + italic suggestions
  await sendText(msg.from, formattedMessage);

  console.log(
    `[WA Webhook] ✓ ${msg.from} | ${duration}ms | success:${success}`,
  );
}

// ─── Format RAG result for WhatsApp ──────────────────────────────────────────

function formatWhatsAppMessage(answer: string, suggestions: string[]): string {
  if (!suggestions.length) return answer;

  const formattedSuggestions = suggestions.map((s) => `_${s}_`).join("\n");

  return `${answer}\n\n*You might also want to ask:*\n${formattedSuggestions}`;
}

// ─── WhatsApp API helpers ─────────────────────────────────────────────────────

/**
 * ONE call that does two things simultaneously:
 *  - Marks the user's message as read (blue double-tick ✓✓)
 *  - Shows the animated typing dots to the user
 *
 * Official Meta payload (confirmed from Meta docs & real implementations):
 * POST /messages
 * {
 *   "messaging_product": "whatsapp",
 *   "status": "read",
 *   "message_id": "<wamid...>",      ← the incoming message id
 *   "typing_indicator": { "type": "text" }
 * }
 *
 * The typing dots last up to 25 seconds and auto-dismiss
 * when the reply message arrives — no manual dismiss needed.
 */
async function markReadAndShowTyping(messageId: string): Promise<void> {
  try {
    await fetch(WA_MESSAGES, {
      method: "POST",
      headers: WA_HEADERS,
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
        typing_indicator: { type: "text" },
      }),
    });
  } catch (err) {
    // Non-critical — user just won't see the indicator, bot still replies
    console.warn("[WA Typing] Failed (non-critical):", err);
  }
}

/**
 * Send plain text reply.
 * Typing indicator auto-dismisses the moment this is delivered.
 */
async function sendText(to: string, body: string): Promise<void> {
  const res = await fetch(WA_MESSAGES, {
    method: "POST",
    headers: WA_HEADERS,
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`WA API ${res.status}: ${JSON.stringify(err)}`);
  }
}

// /**
//  * app/api/whatsapp/webhook/route.ts
//  *
//  * Clean, minimal WhatsApp webhook.
//  * Reads text → runs RAG → sends reply. Nothing else.
//  */

// import { NextRequest, NextResponse } from "next/server";
// import { waitUntil } from "@vercel/functions";
// import { createClient } from "@/lib/supabase/server";
// import { getWhatsAppAnswer } from "@/lib/whatsapp-bot/rag/whatsappRAG";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";
// export const maxDuration = 45;

// const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;
// const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
// const PHONE_NUM_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
// const WA_URL = `https://graph.facebook.com/v25.0/${PHONE_NUM_ID}/messages`;

// // ─── GET: Webhook verification ────────────────────────────────────────────────

// export async function GET(req: NextRequest) {
//   const p = req.nextUrl.searchParams;
//   const ok =
//     p.get("hub.mode") === "subscribe" &&
//     p.get("hub.verify_token") === VERIFY_TOKEN;

//   return ok
//     ? new NextResponse(p.get("hub.challenge"), { status: 200 })
//     : new NextResponse("Forbidden", { status: 403 });
// }

// // ─── POST: Receive messages ───────────────────────────────────────────────────

// export async function POST(req: NextRequest) {
//   const body = await req.json().catch(() => null);

//   // Not a WA event — ignore silently
//   if (body?.object !== "whatsapp_business_account") {
//     return NextResponse.json({ status: "ignored" });
//   }

//   // Extract text messages only
//   const messages: {
//     from: string;
//     text: string;
//     msgId: string;
//     name: string;
//   }[] = (body.entry ?? [])
//     .flatMap((e: any) => e.changes ?? [])
//     .filter((c: any) => c.field === "messages")
//     .flatMap((c: any) => {
//       const { messages = [], contacts = [] } = c.value ?? {};
//       return (messages as any[])
//         .filter((m) => m.type === "text" && m.text?.body?.trim())
//         .map((m) => ({
//           from: m.from,
//           text: (m.text.body as string).trim(),
//           msgId: m.id as string,
//           name:
//             (contacts as any[]).find((c) => c.wa_id === m.from)?.profile
//               ?.name ?? "User",
//         }));
//     });

//   // Nothing actionable — ack and exit fast
//   if (!messages.length) {
//     return NextResponse.json({ status: "ok" });
//   }

//   // ✅ Return 200 immediately — well within WhatsApp's 10s window
//   // waitUntil guarantees Vercel keeps the function alive until processing finishes
//   waitUntil(Promise.allSettled(messages.map(processMessage)));

//   return NextResponse.json({ status: "ok" });
// }

// // ─── Core processor ───────────────────────────────────────────────────────────

// async function processMessage(msg: {
//   from: string;
//   text: string;
//   msgId: string;
//   name: string;
// }): Promise<void> {
//   const t0 = Date.now();
//   const supabase = await createClient();

//   // 1. Persist incoming message
//   const { data: row, error } = await supabase
//     .from("whatsapp_messages")
//     .insert({
//       phone_number: msg.from,
//       message: msg.text,
//       status: "processing",
//       metadata: { user_name: msg.name, message_id: msg.msgId },
//     })
//     .select("id")
//     .single();

//   if (error || !row) {
//     console.error("[WA Webhook] DB insert failed:", error);
//     return;
//   }

//   // 2. Get answer from WhatsApp-optimized RAG
//   let answer = "Sorry, I'm having trouble right now. Please try again shortly.";
//   let success = false;

//   try {
//     answer = await getWhatsAppAnswer(msg.text);
//     success = true;
//   } catch (err) {
//     console.error("[WA Webhook] RAG failed:", err);
//   }

//   const duration = Date.now() - t0;

//   // 3. Persist response (single update)
//   await supabase
//     .from("whatsapp_messages")
//     .update({
//       response: answer,
//       status: "completed",
//       processing_time_ms: duration,
//       metadata: {
//         user_name: msg.name,
//         message_id: msg.msgId,
//         success,
//         duration_ms: duration,
//       },
//     })
//     .eq("id", row.id);

//   // 4. Send reply
//   await sendText(msg.from, answer);

//   console.log(
//     `[WA Webhook] ✓ ${msg.from} | ${duration}ms | success:${success}`,
//   );
// }

// // ─── WhatsApp send ────────────────────────────────────────────────────────────

// async function sendText(to: string, body: string): Promise<void> {
//   const res = await fetch(WA_URL, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${ACCESS_TOKEN}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       messaging_product: "whatsapp",
//       recipient_type: "individual",
//       to,
//       type: "text",
//       text: { preview_url: false, body },
//     }),
//   });

//   if (!res.ok) {
//     const err = await res.json().catch(() => ({}));
//     throw new Error(`WA API ${res.status}: ${JSON.stringify(err)}`);
//   }
// }
