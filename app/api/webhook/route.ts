/**
 * app/api/whatsapp/webhook/route.ts
 *
 * Clean, minimal WhatsApp webhook.
 * Reads text → runs RAG → sends reply. Nothing else.
 */

import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { createClient } from '@/lib/supabase/server';
import { getWhatsAppAnswer } from '@/lib/whatsapp-bot/rag/whatsappRAG';

export const runtime    = 'nodejs';
export const dynamic    = 'force-dynamic';
export const maxDuration = 45;

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
const PHONE_NUM_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const WA_URL       = `https://graph.facebook.com/v25.0/${PHONE_NUM_ID}/messages`;

// ─── GET: Webhook verification ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const ok =
    p.get('hub.mode')         === 'subscribe' &&
    p.get('hub.verify_token') === VERIFY_TOKEN;

  return ok
    ? new NextResponse(p.get('hub.challenge'), { status: 200 })
    : new NextResponse('Forbidden', { status: 403 });
}

// ─── POST: Receive messages ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  // Not a WA event — ignore silently
  if (body?.object !== 'whatsapp_business_account') {
    return NextResponse.json({ status: 'ignored' });
  }

  // Extract text messages only
  const messages: { from: string; text: string; msgId: string; name: string }[] =
    (body.entry ?? [])
      .flatMap((e: any) => e.changes ?? [])
      .filter((c: any) => c.field === 'messages')
      .flatMap((c: any) => {
        const { messages = [], contacts = [] } = c.value ?? {};
        return (messages as any[])
          .filter((m) => m.type === 'text' && m.text?.body?.trim())
          .map((m) => ({
            from:  m.from,
            text:  (m.text.body as string).trim(),
            msgId: m.id as string,
            name:  (contacts as any[]).find((c) => c.wa_id === m.from)
                     ?.profile?.name ?? 'User',
          }));
      });

  // Nothing actionable — ack and exit fast
  if (!messages.length) {
    return NextResponse.json({ status: 'ok' });
  }

  // ✅ Return 200 immediately — well within WhatsApp's 10s window
  // waitUntil guarantees Vercel keeps the function alive until processing finishes
  waitUntil(
    Promise.allSettled(messages.map(processMessage))
  );

  return NextResponse.json({ status: 'ok' });
}

// ─── Core processor ───────────────────────────────────────────────────────────

async function processMessage(msg: {
  from: string; text: string; msgId: string; name: string;
}): Promise<void> {
  const t0       = Date.now();
  const supabase = await createClient();

  // 1. Persist incoming message
  const { data: row, error } = await supabase
    .from('whatsapp_messages')
    .insert({
      phone_number: msg.from,
      message:      msg.text,
      status:       'processing',
      metadata:     { user_name: msg.name, message_id: msg.msgId },
    })
    .select('id')
    .single();

  if (error || !row) {
    console.error('[WA Webhook] DB insert failed:', error);
    return;
  }

  // 2. Get answer from WhatsApp-optimized RAG
  let answer  = "Sorry, I'm having trouble right now. Please try again shortly.";
  let success = false;

  try {
    answer  = await getWhatsAppAnswer(msg.text);
    success = true;
  } catch (err) {
    console.error('[WA Webhook] RAG failed:', err);
  }

  const duration = Date.now() - t0;

  // 3. Persist response (single update)
  await supabase
    .from('whatsapp_messages')
    .update({
      response:            answer,
      status:              'completed',
      processing_time_ms:  duration,
      metadata: {
        user_name:   msg.name,
        message_id:  msg.msgId,
        success,
        duration_ms: duration,
      },
    })
    .eq('id', row.id);

  // 4. Send reply
  await sendText(msg.from, answer);

  console.log(`[WA Webhook] ✓ ${msg.from} | ${duration}ms | success:${success}`);
}

// ─── WhatsApp send ────────────────────────────────────────────────────────────

async function sendText(to: string, body: string): Promise<void> {
  const res = await fetch(WA_URL, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type:    'individual',
      to,
      type: 'text',
      text: { preview_url: false, body },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`WA API ${res.status}: ${JSON.stringify(err)}`);
  }
}