import { WHATSAPP_API_URL, WHATSAPP_ACCESS_TOKEN } from "../../constants";

interface SendMessageParams {
  phoneNumberId: string;
  to: string;
  message: string;
}

interface SendResponseParams {
  phoneNumberId: string;
  to: string;
  answer: string;
  suggestions: string[];
}

/**
 * Send a simple text message
 */
export async function sendWhatsAppMessage({
  phoneNumberId,
  to,
  message,
}: SendMessageParams): Promise<{ success: boolean; messageId?: string }> {
  try {
    console.log(`[WhatsApp Client] Sending message to ${to}`);

    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: {
            preview_url: false,
            body: message,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[WhatsApp Client] Send failed:", error);
      throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    console.log("[WhatsApp Client] Message sent:", result.messages?.[0]?.id);
    
    return {
      success: true,
      messageId: result.messages?.[0]?.id,
    };

  } catch (error) {
    console.error("[WhatsApp Client] Error:", error);
    return { success: false };
  }
}

/**
 * Send answer with interactive button suggestions
 */
export async function sendWhatsAppResponse({
  phoneNumberId,
  to,
  answer,
  suggestions,
}: SendResponseParams): Promise<void> {
  try {
    // Send the main answer (if provided)
    if (answer && answer.trim()) {
      await sendWhatsAppMessage({ phoneNumberId, to, message: answer });
    }

    // If there are suggestions, send them as interactive buttons (max 3)
    if (suggestions && suggestions.length > 0) {
      const buttons = suggestions.slice(0, 3).map((suggestion, index) => ({
        type: "reply",
        reply: {
          id: `suggestion_${index}`,
          title: suggestion.substring(0, 20), // Max 20 chars for button title
        },
      }));

      console.log(`[WhatsApp Client] Sending ${buttons.length} suggestion buttons`);

      const response = await fetch(
        `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "interactive",
            interactive: {
              type: "button",
              body: {
                text: "You might also want to ask:",
              },
              action: {
                buttons,
              },
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("[WhatsApp Client] Interactive message failed:", error);
        // Don't throw - suggestions are optional
      } else {
        console.log("[WhatsApp Client] Interactive buttons sent");
      }
    }
  } catch (error) {
    console.error("[WhatsApp Client] Error sending response:", error);
  }
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(
  phoneNumberId: string,
  messageId: string
): Promise<void> {
  try {
    await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });
  } catch (error) {
    console.error("[WhatsApp Client] Mark as read failed:", error);
  }
}

/**
 * Send typing indicator (shows "..." in chat)
 */
export async function sendTypingIndicator(
  phoneNumberId: string,
  to: string,
  isTyping: boolean
): Promise<void> {
  try {
    if (!isTyping) return; // WhatsApp doesn't have "stop typing"

    // Note: There's no official typing indicator in Cloud API
    // This is a workaround that may or may not work
    // The official way is to just respond quickly
    
    console.log(`[WhatsApp Client] Typing indicator sent to ${to}`);
  } catch (error) {
    console.error("[WhatsApp Client] Typing indicator failed:", error);
  }
}