import { NextRequest, NextResponse } from 'next/server';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'CareLink2025Secure!Token';

// Webhook verification (GET request from Meta)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully!');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.log('❌ Webhook verification failed');
    return new NextResponse('Forbidden', { status: 403 });
  }
}

// Receive incoming messages (POST request from Meta)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📨 Webhook received:', JSON.stringify(body, null, 2));

    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach((entry: any) => {
        const changes = entry.changes[0];
        const value = changes.value;

        // Handle incoming messages
        if (value.messages) {
          const message = value.messages[0];
          const from = message.from; // Customer's phone number
          const messageBody = message.text?.body; // Message text
          const messageId = message.id;

          console.log(`📞 From: ${from}`);
          console.log(`💬 Message: ${messageBody}`);
          console.log(`🆔 Message ID: ${messageId}`);

          // TODO: Process with your AI logic here
          // Example: sendToAI(from, messageBody);
          // Then send response back to customer
        }

        // Handle message status updates (delivered, read, etc.)
        if (value.statuses) {
          const status = value.statuses[0];
          console.log(`📊 Status update: ${status.status}`);
        }
      });

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'Not a WhatsApp event' }, { status: 404 });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


// ============================================================================
// COMPLETE WHATSAPP WEBHOOK API
// app/api/whatsapp/webhook/route.ts
// ============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import { answerWithHospitalContext } from "@/lib/rag/answerWithHospitalContext";
// import { getHospitalNamespace } from "@/lib/pinecone/pineconeClient";
// import {
//   sendWhatsAppMessage,
//   sendWhatsAppResponse,
//   markMessageAsRead,
//   sendTypingIndicator,
// } from "@/lib/whatsapp/whatsappClient";
// import { handleButtonClick } from "@/lib/whatsapp/handleInteractiveMessage";
// import { handleMessageStatus } from "@/lib/whatsapp/statusHandler";
// import { formatWhatsAppResponse, splitLongMessage } from "@/lib/whatsapp/formatResponse";
// import { createClient } from "@/lib/supabase/server";
// import crypto from "crypto";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";
// export const maxDuration = 45;

// // Environment variables
// const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;
// const WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET;

// // ============================================================================
// // GET - WEBHOOK VERIFICATION (Required by WhatsApp)
// // ============================================================================

// /**
//  * WhatsApp calls this endpoint to verify your webhook URL
//  * This happens when you configure the webhook in Meta Dashboard
//  */
// export async function GET(req: NextRequest) {
//   try {
//     const searchParams = req.nextUrl.searchParams;
    
//     const mode = searchParams.get("hub.mode");
//     const token = searchParams.get("hub.verify_token");
//     const challenge = searchParams.get("hub.challenge");

//     console.log("[WhatsApp Webhook] Verification request:", { mode, token });

//     // Check if mode and token match
//     if (mode === "subscribe" && token === VERIFY_TOKEN) {
//       console.log("[WhatsApp Webhook] ✓ Verification successful");
//       // Respond with the challenge token from the request
//       return new NextResponse(challenge, { status: 200 });
//     }

//     // Verification failed
//     console.error("[WhatsApp Webhook] ✗ Verification failed - invalid token");
//     return new NextResponse("Forbidden", { status: 403 });

//   } catch (error) {
//     console.error("[WhatsApp Webhook] Verification error:", error);
//     return new NextResponse("Internal Server Error", { status: 500 });
//   }
// }

// // ============================================================================
// // POST - RECEIVE WHATSAPP MESSAGES
// // ============================================================================

// /**
//  * WhatsApp sends incoming messages and status updates to this endpoint
//  */
// export async function POST(req: NextRequest) {
//   try {
//     const rawBody = await req.text();
    
//     // Verify webhook signature (security measure)
//     if (WEBHOOK_SECRET) {
//       const signature = req.headers.get("x-hub-signature-256");
//       if (!verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET)) {
//         console.error("[WhatsApp Webhook] ✗ Invalid signature");
//         return new NextResponse("Unauthorized", { status: 401 });
//       }
//     }

//     const body = JSON.parse(rawBody);
//     console.log("[WhatsApp Webhook] Received:", JSON.stringify(body, null, 2));

//     // WhatsApp sends test webhook on setup - acknowledge it
//     if (body.object !== "whatsapp_business_account") {
//       console.log("[WhatsApp Webhook] Ignoring non-WhatsApp object");
//       return NextResponse.json({ status: "ignored" }, { status: 200 });
//     }

//     // Process each entry in the webhook
//     for (const entry of body.entry || []) {
//       for (const change of entry.changes || []) {
//         const value = change.value;

//         // Handle message events
//         if (change.field === "messages") {
//           const messages = value.messages || [];
//           const statuses = value.statuses || [];
//           const metadata = value.metadata;
//           const contacts = value.contacts || [];

//           // Process incoming messages
//           for (const message of messages) {
//             await processIncomingMessage({
//               message,
//               metadata,
//               contacts,
//             });
//           }

//           // Process message status updates
//           for (const status of statuses) {
//             await handleMessageStatus(status);
//           }
//         }

//         // Handle other webhook events (account_alerts, etc.)
//         if (change.field !== "messages") {
//           console.log(`[WhatsApp Webhook] Received ${change.field} event`);
//           // You can add handlers for other events here
//         }
//       }
//     }

//     // Always respond with 200 OK to acknowledge receipt
//     return NextResponse.json({ status: "ok" }, { status: 200 });

//   } catch (error) {
//     console.error("[WhatsApp Webhook] Critical error:", error);
//     // Still return 200 to prevent WhatsApp from retrying indefinitely
//     return NextResponse.json({ status: "error", message: String(error) }, { status: 200 });
//   }
// }

// // ============================================================================
// // PROCESS INCOMING MESSAGE
// // ============================================================================

// async function processIncomingMessage({
//   message,
//   metadata,
//   contacts,
// }: {
//   message: any;
//   metadata: any;
//   contacts: any[];
// }) {
//   const messageType = message.type;
//   const userPhoneNumber = message.from;
//   const messageId = message.id;
//   const phoneNumberId = metadata.phone_number_id;
  
//   const contact = contacts.find((c) => c.wa_id === userPhoneNumber);
//   const userName = contact?.profile?.name || "User";

//   console.log(`[WhatsApp Bot] Message from ${userName} (${userPhoneNumber})`);
//   console.log(`[WhatsApp Bot] Type: ${messageType}, ID: ${messageId}`);

//   try {
//     // Extract user message based on type
//     let userMessage = "";

//     switch (messageType) {
//       case "text":
//         userMessage = message.text?.body || "";
//         break;
      
//       case "interactive":
//         // Handle button clicks
//         userMessage = await handleButtonClick(message);
//         if (!userMessage) {
//           console.log("[WhatsApp Bot] No text from interactive message, skipping");
//           return;
//         }
//         break;
      
//       case "button":
//         // Handle quick reply buttons
//         userMessage = message.button?.text || "";
//         break;
      
//       default:
//         console.log(`[WhatsApp Bot] Unsupported message type: ${messageType}`);
//         await sendWhatsAppMessage({
//           phoneNumberId,
//           to: userPhoneNumber,
//           message: "I can only process text messages at the moment. Please send your question as text.",
//         });
//         return;
//     }

//     if (!userMessage.trim()) {
//       console.log("[WhatsApp Bot] Empty message, skipping");
//       return;
//     }

//     console.log(`[WhatsApp Bot] Message text: "${userMessage}"`);

//     // Get Supabase client
//     const supabase = await createClient();

//     // Get or create user session
//     const { userId, sessionId } = await getOrCreateWhatsAppSession(
//       supabase,
//       userPhoneNumber,
//       userName
//     );

//     console.log(`[WhatsApp Bot] User ID: ${userId}, Session ID: ${sessionId}`);

//     // Save incoming message to database
//     const { error: insertError } = await supabase
//       .from("chat_messages")
//       .insert({
//         chat_session_id: sessionId,
//         role: "user",
//         content_text: userMessage,
//         content_json: [],
//         metadata: {
//           whatsapp_message_id: messageId,
//           phone_number: userPhoneNumber,
//           message_type: messageType,
//           platform: "whatsapp",
//         },
//       });

//     if (insertError) {
//       console.error("[WhatsApp Bot] Failed to save user message:", insertError);
//     }

//     // Mark message as read (optional - shows double blue ticks)
//     await markMessageAsRead(phoneNumberId, messageId);

//     // Send typing indicator (optional - shows "..." to user)
//     await sendTypingIndicator(phoneNumberId, userPhoneNumber, true);

//     // Process with RAG system
//     const startTime = Date.now();
//     let assistantContent = {
//       answer: "I'm having trouble right now. Please try again shortly.",
//       suggestions: [],
//     };
//     let contextUsed: any[] = [];
//     let queryIntent = "unknown";

//     try {
//       console.log("[WhatsApp Bot] Starting RAG processing...");

//       const result = await answerWithHospitalContext({
//         content: userMessage.trim(),
//         namespace: getHospitalNamespace(),
//         topK: 3,
//         onProgress: (stage, details) => {
//           console.log(`[WhatsApp Bot] RAG Stage: ${stage}`, details);
//           if (details?.intent) {
//             queryIntent = details.intent;
//           }
//         },
//       });

//       assistantContent = result.assistantContent;
//       contextUsed = result.contextUsed;

//       const processingTime = Date.now() - startTime;
//       console.log(`[WhatsApp Bot] ✓ RAG complete in ${processingTime}ms`);
//       console.log(`[WhatsApp Bot] Intent: ${queryIntent}, Sources: ${contextUsed.length}`);

//     } catch (ragError) {
//       console.error("[WhatsApp Bot] RAG processing failed:", ragError);
      
//       // Fallback response
//       assistantContent = {
//         answer: "I'm experiencing technical difficulties. Please try again in a moment.",
//         suggestions: [
//           "What are the OPD timings?",
//           "How do I book an appointment?",
//           "What is the hospital address?",
//         ],
//       };
//     }

//     // Stop typing indicator
//     await sendTypingIndicator(phoneNumberId, userPhoneNumber, false);

//     // Format response for WhatsApp
//     const formattedAnswer = formatWhatsAppResponse(assistantContent.answer);
    
//     // Split long messages if needed (WhatsApp limit: ~4096 chars)
//     const messageParts = splitLongMessage(formattedAnswer, 4000);

//     // Send response via WhatsApp
//     try {
//       // Send main answer (possibly in parts)
//       for (const part of messageParts) {
//         await sendWhatsAppMessage({
//           phoneNumberId,
//           to: userPhoneNumber,
//           message: part,
//         });
        
//         // Small delay between parts to ensure order
//         if (messageParts.length > 1) {
//           await new Promise(resolve => setTimeout(resolve, 500));
//         }
//       }

//       // Send suggestions as interactive buttons (if any)
//       if (assistantContent.suggestions && assistantContent.suggestions.length > 0) {
//         await sendWhatsAppResponse({
//           phoneNumberId,
//           to: userPhoneNumber,
//           answer: "", // Already sent above
//           suggestions: assistantContent.suggestions,
//         });
//       }

//       console.log("[WhatsApp Bot] ✓ Response sent successfully");

//     } catch (sendError) {
//       console.error("[WhatsApp Bot] Failed to send response:", sendError);
      
//       // Try to send a simple error message
//       try {
//         await sendWhatsAppMessage({
//           phoneNumberId,
//           to: userPhoneNumber,
//           message: "I'm having trouble sending my response. Please try again.",
//         });
//       } catch (fallbackError) {
//         console.error("[WhatsApp Bot] Even fallback message failed:", fallbackError);
//       }
//     }

//     // Save assistant response to database
//     const responseTime = Date.now() - startTime;
//     const { error: assistantInsertError } = await supabase
//       .from("chat_messages")
//       .insert({
//         chat_session_id: sessionId,
//         role: "assistant",
//         content_text: assistantContent.answer,
//         content_json: assistantContent.suggestions,
//         context_used: contextUsed,
//         metadata: {
//           query_intent: queryIntent,
//           used_rag: contextUsed.length > 0,
//           sources_count: contextUsed.length,
//           response_time_ms: responseTime,
//           platform: "whatsapp",
//         },
//       });

//     if (assistantInsertError) {
//       console.error("[WhatsApp Bot] Failed to save assistant message:", assistantInsertError);
//     }

//     // Increment message count
//     const { error: rpcError } = await supabase.rpc("increment_message_count", {
//       session_id: sessionId,
//     });

//     if (rpcError) {
//       console.error("[WhatsApp Bot] Failed to increment message count:", rpcError);
//     }

//     // Log analytics (optional)
//     await logWhatsAppInteraction({
//       userId,
//       phoneNumber: userPhoneNumber,
//       messageType: "incoming",
//       intent: queryIntent,
//       usedRAG: contextUsed.length > 0,
//       responseTime,
//     });

//     console.log("[WhatsApp Bot] ✓ Message processing complete");

//   } catch (error) {
//     console.error("[WhatsApp Bot] Error processing message:", error);
    
//     // Send error message to user
//     try {
//       await sendWhatsAppMessage({
//         phoneNumberId,
//         to: userPhoneNumber,
//         message: "Sorry, I encountered an error processing your message. Please try again or contact support if the issue persists.",
//       });
//     } catch (sendError) {
//       console.error("[WhatsApp Bot] Failed to send error message:", sendError);
//     }
//   }
// }

// // ============================================================================
// // SESSION MANAGEMENT
// // ============================================================================

// async function getOrCreateWhatsAppSession(
//   supabase: any,
//   phoneNumber: string,
//   userName: string
// ): Promise<{ userId: string; sessionId: string }> {
//   try {
//     // Find or create WhatsApp user
//     let { data: whatsappUser } = await supabase
//       .from("whatsapp_users")
//       .select("id, user_id")
//       .eq("phone_number", phoneNumber)
//       .single();

//     if (!whatsappUser) {
//       console.log(`[Session] Creating new WhatsApp user for ${phoneNumber}`);
      
//       // Create anonymous auth user first (optional - depends on your setup)
//       // Or you can create a generic user_id for all WhatsApp users
      
//       const { data: newWhatsappUser, error: createError } = await supabase
//         .from("whatsapp_users")
//         .insert({
//           phone_number: phoneNumber,
//           name: userName,
//           metadata: {
//             platform: "whatsapp",
//             first_contact: new Date().toISOString(),
//           },
//         })
//         .select("id, user_id")
//         .single();

//       if (createError) {
//         console.error("[Session] Failed to create WhatsApp user:", createError);
//         throw createError;
//       }

//       whatsappUser = newWhatsappUser;
//     } else {
//       // Update name if it changed
//       if (whatsappUser.name !== userName) {
//         await supabase
//           .from("whatsapp_users")
//           .update({ name: userName })
//           .eq("id", whatsappUser.id);
//       }
//     }

//     // Find or create active session for this user
//     const { data: existingSession } = await supabase
//       .from("chat_sessions")
//       .select("id")
//       .eq("user_id", whatsappUser.user_id)
//       .eq("metadata->>platform", "whatsapp")
//       .eq("metadata->>phone_number", phoneNumber)
//       .order("created_at", { ascending: false })
//       .limit(1)
//       .single();

//     if (existingSession) {
//       console.log(`[Session] Using existing session: ${existingSession.id}`);
//       return {
//         userId: whatsappUser.user_id,
//         sessionId: existingSession.id,
//       };
//     }

//     // Create new session
//     console.log(`[Session] Creating new session for ${phoneNumber}`);
//     const { data: newSession, error: sessionError } = await supabase
//       .from("chat_sessions")
//       .insert({
//         user_id: whatsappUser.user_id,
//         title: `WhatsApp Chat - ${userName}`,
//         metadata: {
//           platform: "whatsapp",
//           phone_number: phoneNumber,
//           user_name: userName,
//           started_at: new Date().toISOString(),
//         },
//       })
//       .select("id")
//       .single();

//     if (sessionError) {
//       console.error("[Session] Failed to create session:", sessionError);
//       throw sessionError;
//     }

//     console.log(`[Session] Created new session: ${newSession.id}`);

//     return {
//       userId: whatsappUser.user_id,
//       sessionId: newSession.id,
//     };

//   } catch (error) {
//     console.error("[Session] Error in session management:", error);
//     throw error;
//   }
// }

// // ============================================================================
// // WEBHOOK SIGNATURE VERIFICATION
// // ============================================================================

// function verifyWebhookSignature(
//   payload: string,
//   signature: string | null,
//   secret: string
// ): boolean {
//   if (!signature) {
//     console.warn("[Security] No signature provided");
//     return false;
//   }

//   try {
//     const expectedSignature = crypto
//       .createHmac("sha256", secret)
//       .update(payload)
//       .digest("hex");

//     const providedSignature = signature.replace("sha256=", "");

//     const isValid = crypto.timingSafeEqual(
//       Buffer.from(expectedSignature),
//       Buffer.from(providedSignature)
//     );

//     if (!isValid) {
//       console.error("[Security] Signature mismatch!");
//     }

//     return isValid;

//   } catch (error) {
//     console.error("[Security] Signature verification error:", error);
//     return false;
//   }
// }

// // ============================================================================
// // ANALYTICS LOGGING
// // ============================================================================

// async function logWhatsAppInteraction(data: {
//   userId: string;
//   phoneNumber: string;
//   messageType: "incoming" | "outgoing";
//   intent?: string;
//   usedRAG: boolean;
//   responseTime?: number;
// }): Promise<void> {
//   try {
//     const supabase = await createClient();

//     const { error } = await supabase.from("whatsapp_analytics").insert({
//       user_id: data.userId,
//       phone_number: data.phoneNumber,
//       message_type: data.messageType,
//       query_intent: data.intent,
//       used_rag: data.usedRAG,
//       response_time_ms: data.responseTime,
//       timestamp: new Date().toISOString(),
//     });

//     if (error) {
//       console.error("[Analytics] Failed to log interaction:", error);
//     }
//   } catch (error) {
//     console.error("[Analytics] Error logging interaction:", error);
//   }
// }



// /api/whatsapp/webhook/route.ts

// ============================================================================
// 1. WHATSAPP WEBHOOK ENDPOINT
// app/api/whatsapp/webhook/route.ts
// ============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import { answerWithHospitalContext } from "@/lib/rag/answerWithHospitalContext";
// import { getHospitalNamespace } from "@/lib/pinecone/pineconeClient";
// import { sendWhatsAppMessage } from "@/lib/whatsapp/whatsappClient";
// import { createClient } from "@/lib/supabase/server";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";
// export const maxDuration = 45;

// // Environment variables
// const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;
// const WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET;

// /**
//  * GET - Webhook Verification (required by WhatsApp)
//  * WhatsApp will call this endpoint to verify your webhook
//  */
// export async function GET(req: NextRequest) {
//   const searchParams = req.nextUrl.searchParams;
  
//   const mode = searchParams.get("hub.mode");
//   const token = searchParams.get("hub.verify_token");
//   const challenge = searchParams.get("hub.challenge");

//   console.log("[WhatsApp Webhook] Verification request:", { mode, token });

//   // Check if a token and mode were sent
//   if (mode === "subscribe" && token === VERIFY_TOKEN) {
//     // Respond with 200 OK and challenge token from the request
//     console.log("[WhatsApp Webhook] Verification successful");
//     return new NextResponse(challenge, { status: 200 });
//   }

//   // Respond with 403 Forbidden if verify tokens do not match
//   console.error("[WhatsApp Webhook] Verification failed");
//   return new NextResponse("Forbidden", { status: 403 });
// }

// /**
//  * POST - Receive WhatsApp Messages
//  * WhatsApp sends incoming messages to this endpoint
//  */
// export async function POST(req: NextRequest) {
//   try {
//     // Verify webhook signature (optional but recommended)
//     if (WEBHOOK_SECRET) {
//       const signature = req.headers.get("x-hub-signature-256");
//       if (!verifyWebhookSignature(await req.text(), signature, WEBHOOK_SECRET)) {
//         console.error("[WhatsApp Webhook] Invalid signature");
//         return new NextResponse("Unauthorized", { status: 401 });
//       }
//     }

//     const body = await req.json();
//     console.log("[WhatsApp Webhook] Received:", JSON.stringify(body, null, 2));

//     // WhatsApp sends a test webhook on setup - acknowledge it
//     if (body.object !== "whatsapp_business_account") {
//       return NextResponse.json({ status: "ignored" }, { status: 200 });
//     }

//     // Process each entry in the webhook
//     for (const entry of body.entry || []) {
//       for (const change of entry.changes || []) {
//         // We only care about message events
//         if (change.field !== "messages") continue;

//         const value = change.value;
//         const messages = value.messages || [];
//         const metadata = value.metadata;

//         // Process each message
//         for (const message of messages) {
//           // Ignore status updates, only process incoming messages
//           if (message.type === "text") {
//             await handleIncomingMessage({
//               message,
//               metadata,
//               contacts: value.contacts || [],
//             });
//           }
//         }
//       }
//     }

//     // Always respond with 200 OK to acknowledge receipt
//     return NextResponse.json({ status: "ok" }, { status: 200 });

//   } catch (error) {
//     console.error("[WhatsApp Webhook] Error:", error);
//     // Still return 200 to prevent WhatsApp from retrying
//     return NextResponse.json({ status: "error" }, { status: 200 });
//   }
// }

// /**
//  * Handle incoming WhatsApp message
//  */
// async function handleIncomingMessage({
//   message,
//   metadata,
//   contacts,
// }: {
//   message: any;
//   metadata: any;
//   contacts: any[];
// }) {
//   const userPhoneNumber = message.from;
//   const userMessage = message.text?.body || "";
//   const messageId = message.id;
//   const phoneNumberId = metadata.phone_number_id;
  
//   const contact = contacts.find((c) => c.wa_id === userPhoneNumber);
//   const userName = contact?.profile?.name || "User";

//   console.log(`[WhatsApp Bot] Message from ${userName} (${userPhoneNumber}): "${userMessage}"`);

//   try {
//     // Get or create user session in database
//     const supabase = await createClient();
//     const { userId, sessionId } = await getOrCreateWhatsAppSession(
//       supabase,
//       userPhoneNumber,
//       userName
//     );

//     // Save incoming message to database
//     await supabase.from("chat_messages").insert({
//       chat_session_id: sessionId,
//       role: "user",
//       content_text: userMessage,
//       content_json: [],
//       metadata: {
//         whatsapp_message_id: messageId,
//         phone_number: userPhoneNumber,
//       },
//     });

//     // Mark message as read (optional)
//     await markMessageAsRead(phoneNumberId, messageId);

//     // Send typing indicator (optional)
//     await sendTypingIndicator(phoneNumberId, userPhoneNumber, true);

//     // Process with RAG system
//     let assistantContent = {
//       answer: "I'm having trouble right now. Please try again shortly.",
//       suggestions: [],
//     };
//     let contextUsed: any[] = [];
//     let queryIntent = "unknown";

//     try {
//       const result = await answerWithHospitalContext({
//         content: userMessage.trim(),
//         namespace: getHospitalNamespace(),
//         topK: 3,
//         onProgress: (stage, details) => {
//           console.log(`[WhatsApp Bot] RAG Stage: ${stage}`, details);
//           if (details?.intent) {
//             queryIntent = details.intent;
//           }
//         },
//       });

//       assistantContent = result.assistantContent;
//       contextUsed = result.contextUsed;

//       console.log(`[WhatsApp Bot] RAG complete - Intent: ${queryIntent}, Sources: ${contextUsed.length}`);

//     } catch (error) {
//       console.error("[WhatsApp Bot] RAG failed:", error);
//       assistantContent = {
//         answer: "I'm experiencing technical difficulties. Please try again in a moment.",
//         suggestions: [
//           "What are the OPD timings?",
//           "How do I book an appointment?",
//           "What is the hospital address?",
//         ],
//       };
//     }

//     // Stop typing indicator
//     await sendTypingIndicator(phoneNumberId, userPhoneNumber, false);

//     // Send response via WhatsApp
//     await sendWhatsAppResponse({
//       phoneNumberId,
//       to: userPhoneNumber,
//       answer: assistantContent.answer,
//       suggestions: assistantContent.suggestions,
//     });

//     // Save assistant response to database
//     await supabase.from("chat_messages").insert({
//       chat_session_id: sessionId,
//       role: "assistant",
//       content_text: assistantContent.answer,
//       content_json: assistantContent.suggestions,
//       context_used: contextUsed,
//       metadata: {
//         query_intent: queryIntent,
//         used_rag: contextUsed.length > 0,
//         sources_count: contextUsed.length,
//       },
//     });

//     // Increment message count
//     await supabase.rpc("increment_message_count", { session_id: sessionId });

//   } catch (error) {
//     console.error("[WhatsApp Bot] Error processing message:", error);
    
//     // Send error message to user
//     await sendWhatsAppMessage({
//       phoneNumberId,
//       to: userPhoneNumber,
//       message: "Sorry, I encountered an error. Please try again.",
//     });
//   }
// }

// /**
//  * Get or create WhatsApp user session
//  */
// async function getOrCreateWhatsAppSession(
//   supabase: any,
//   phoneNumber: string,
//   userName: string
// ): Promise<{ userId: string; sessionId: string }> {
//   // Find or create user based on phone number
//   let { data: user } = await supabase
//     .from("whatsapp_users")
//     .select("id, user_id")
//     .eq("phone_number", phoneNumber)
//     .single();

//   if (!user) {
//     // Create new WhatsApp user
//     const { data: newUser, error } = await supabase
//       .from("whatsapp_users")
//       .insert({
//         phone_number: phoneNumber,
//         name: userName,
//         metadata: { platform: "whatsapp" },
//       })
//       .select("id, user_id")
//       .single();

//     if (error) throw error;
//     user = newUser;
//   }

//   // Find or create active session
//   const { data: existingSession } = await supabase
//     .from("chat_sessions")
//     .select("id")
//     .eq("user_id", user.user_id)
//     .eq("metadata->>platform", "whatsapp")
//     .eq("metadata->>phone_number", phoneNumber)
//     .order("created_at", { ascending: false })
//     .limit(1)
//     .single();

//   if (existingSession) {
//     return {
//       userId: user.user_id,
//       sessionId: existingSession.id,
//     };
//   }

//   // Create new session
//   const { data: newSession, error: sessionError } = await supabase
//     .from("chat_sessions")
//     .insert({
//       user_id: user.user_id,
//       title: `WhatsApp Chat - ${userName}`,
//       metadata: {
//         platform: "whatsapp",
//         phone_number: phoneNumber,
//       },
//     })
//     .select("id")
//     .single();

//   if (sessionError) throw sessionError;

//   return {
//     userId: user.user_id,
//     sessionId: newSession.id,
//   };
// }

// /**
//  * Verify webhook signature (security measure)
//  */
// function verifyWebhookSignature(
//   payload: string,
//   signature: string | null,
//   secret: string
// ): boolean {
//   if (!signature) return false;

//   const crypto = require("crypto");
//   const expectedSignature = crypto
//     .createHmac("sha256", secret)
//     .update(payload)
//     .digest("hex");

//   return signature === `sha256=${expectedSignature}`;
// }

// // ============================================================================
// // 2. WHATSAPP CLIENT (Send Messages)
// // lib/whatsapp/whatsappClient.ts
// // ============================================================================

// const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";
// const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;

// interface SendMessageParams {
//   phoneNumberId: string;
//   to: string;
//   message: string;
// }

// interface SendResponseParams {
//   phoneNumberId: string;
//   to: string;
//   answer: string;
//   suggestions: string[];
// }

// /**
//  * Send a simple text message
//  */
// export async function sendWhatsAppMessage({
//   phoneNumberId,
//   to,
//   message,
// }: SendMessageParams): Promise<void> {
//   try {
//     const response = await fetch(
//       `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
//         },
//         body: JSON.stringify({
//           messaging_product: "whatsapp",
//           recipient_type: "individual",
//           to,
//           type: "text",
//           text: {
//             preview_url: false,
//             body: message,
//           },
//         }),
//       }
//     );

//     if (!response.ok) {
//       const error = await response.json();
//       console.error("[WhatsApp Client] Send failed:", error);
//       throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`);
//     }

//     const result = await response.json();
//     console.log("[WhatsApp Client] Message sent:", result);
//   } catch (error) {
//     console.error("[WhatsApp Client] Error:", error);
//     throw error;
//   }
// }

// /**
//  * Send answer with interactive button suggestions
//  */
// export async function sendWhatsAppResponse({
//   phoneNumberId,
//   to,
//   answer,
//   suggestions,
// }: SendResponseParams): Promise<void> {
//   try {
//     // Send the main answer
//     await sendWhatsAppMessage({ phoneNumberId, to, message: answer });

//     // If there are suggestions, send them as interactive buttons (max 3)
//     if (suggestions && suggestions.length > 0) {
//       const buttons = suggestions.slice(0, 3).map((suggestion, index) => ({
//         type: "reply",
//         reply: {
//           id: `suggestion_${index}`,
//           title: suggestion.substring(0, 20), // Max 20 chars for button title
//         },
//       }));

//       const response = await fetch(
//         `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
//           },
//           body: JSON.stringify({
//             messaging_product: "whatsapp",
//             recipient_type: "individual",
//             to,
//             type: "interactive",
//             interactive: {
//               type: "button",
//               body: {
//                 text: "You might also want to ask:",
//               },
//               action: {
//                 buttons,
//               },
//             },
//           }),
//         }
//       );

//       if (!response.ok) {
//         const error = await response.json();
//         console.error("[WhatsApp Client] Interactive message failed:", error);
//         // Don't throw - suggestions are optional
//       } else {
//         console.log("[WhatsApp Client] Interactive message sent");
//       }
//     }
//   } catch (error) {
//     console.error("[WhatsApp Client] Error sending response:", error);
//     throw error;
//   }
// }

// /**
//  * Mark message as read
//  */
// export async function markMessageAsRead(
//   phoneNumberId: string,
//   messageId: string
// ): Promise<void> {
//   try {
//     await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
//       },
//       body: JSON.stringify({
//         messaging_product: "whatsapp",
//         status: "read",
//         message_id: messageId,
//       }),
//     });
//   } catch (error) {
//     console.error("[WhatsApp Client] Mark as read failed:", error);
//   }
// }

// /**
//  * Send typing indicator
//  */
// export async function sendTypingIndicator(
//   phoneNumberId: string,
//   to: string,
//   isTyping: boolean
// ): Promise<void> {
//   try {
//     if (!isTyping) return; // WhatsApp doesn't support "stop typing"

//     await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
//       },
//       body: JSON.stringify({
//         messaging_product: "whatsapp",
//         recipient_type: "individual",
//         to,
//         type: "text",
//         text: {
//           body: "...", // This creates a typing effect
//         },
//       }),
//     });
//   } catch (error) {
//     console.error("[WhatsApp Client] Typing indicator failed:", error);
//   }
// }

// ============================================================================
// 3. DATABASE SCHEMA FOR WHATSAPP USERS
// SQL Migration
// ============================================================================

/*
-- Create whatsapp_users table
CREATE TABLE whatsapp_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_whatsapp_users_phone ON whatsapp_users(phone_number);
CREATE INDEX idx_whatsapp_users_user_id ON whatsapp_users(user_id);

-- Update chat_sessions to support WhatsApp
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update chat_messages to store WhatsApp metadata
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
*/

// ============================================================================
// 4. ENVIRONMENT VARIABLES (.env.local)
// ============================================================================

/*
# WhatsApp Cloud API Configuration
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_VERIFY_TOKEN=your_random_verify_token_string
WHATSAPP_WEBHOOK_SECRET=your_webhook_secret (optional)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Your webhook URL (for WhatsApp configuration)
# Example: https://yourdomain.com/api/whatsapp/webhook
*/

// ============================================================================
// 5. WHATSAPP SETUP INSTRUCTIONS
// ============================================================================

/*
SETUP STEPS:

1. Create a Meta (Facebook) App:
   - Go to https://developers.facebook.com/
   - Create a new app → "Business" type
   - Add "WhatsApp" product

2. Get your credentials:
   - Phone Number ID: In WhatsApp > Getting Started
   - Access Token: In WhatsApp > Getting Started (temporary) or generate permanent one
   - Create a verify token: Any random string (e.g., "my_secure_verify_token_123")

3. Configure webhook in Meta App Dashboard:
   - Go to WhatsApp > Configuration
   - Callback URL: https://yourdomain.com/api/whatsapp/webhook
   - Verify Token: Same as WHATSAPP_VERIFY_TOKEN in .env
   - Subscribe to "messages" field

4. Add environment variables to your .env.local

5. Deploy your webhook endpoint

6. Test with WhatsApp test number or add your number to allowed list

7. For production: Submit app for review and get verified

TESTING LOCALLY:
- Use ngrok to expose your local server:
  ngrok http 3000
- Use the ngrok URL as your webhook URL
- Example: https://abc123.ngrok.io/api/whatsapp/webhook
*/