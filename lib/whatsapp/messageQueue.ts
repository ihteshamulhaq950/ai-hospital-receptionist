// 4. RATE LIMITING & QUEUE MANAGEMENT
// lib/whatsapp/messageQueue.ts
// ============================================================================

interface QueuedMessage {
  phoneNumberId: string;
  to: string;
  message: string;
  priority: number;
  retries: number;
}

class WhatsAppMessageQueue {
  private queue: QueuedMessage[] = [];
  private processing = false;
  private readonly MAX_RETRIES = 3;
  private readonly RATE_LIMIT_MS = 1000; // 1 message per second

  async enqueue(message: Omit<QueuedMessage, "retries">): Promise<void> {
    this.queue.push({ ...message, retries: 0 });
    this.queue.sort((a, b) => b.priority - a.priority);
    
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      const message = this.queue.shift();
      if (!message) break;

      try {
        const { sendWhatsAppMessage } = await import("./whatsappClient");
        await sendWhatsAppMessage({
          phoneNumberId: message.phoneNumberId,
          to: message.to,
          message: message.message,
        });

        console.log(`[Queue] Message sent to ${message.to}`);
      } catch (error) {
        console.error(`[Queue] Failed to send to ${message.to}:`, error);

        // Retry logic
        if (message.retries < this.MAX_RETRIES) {
          message.retries++;
          this.queue.push(message);
          console.log(`[Queue] Retrying message (attempt ${message.retries})`);
        } else {
          console.error(`[Queue] Max retries reached for ${message.to}`);
        }
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, this.RATE_LIMIT_MS));
    }

    this.processing = false;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

export const messageQueue = new WhatsAppMessageQueue();


// 5. WEBHOOK STATUS UPDATES
// Handle message status updates (delivered, read, failed, etc.)
// ============================================================================

export async function handleMessageStatus(status: any): Promise<void> {
  const messageId = status.id;
  const recipientId = status.recipient_id;
  const statusType = status.status; // sent, delivered, read, failed

  console.log(`[WhatsApp Status] Message ${messageId} to ${recipientId}: ${statusType}`);

  // Update database with delivery status
  const supabase = await import("@/lib/supabase/server").then((m) => m.createClient());
  
  await (await supabase)
    .from("chat_messages")
    .update({
      metadata: {
        delivery_status: statusType,
        updated_at: new Date().toISOString(),
      },
    })
    .eq("metadata->>whatsapp_message_id", messageId);

  // Handle failures
  if (statusType === "failed") {
    const error = status.errors?.[0];
    console.error(`[WhatsApp Status] Delivery failed:`, error);
    
    // You could implement retry logic here
    // or notify admins of the failure
  }
}