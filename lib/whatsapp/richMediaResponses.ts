// 2. SEND RICH MEDIA RESPONSES
// lib/whatsapp/richMediaResponses.ts
// ============================================================================

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;

/**
 * Send a list of options (better for 4+ suggestions)
 */
export async function sendWhatsAppList({
  phoneNumberId,
  to,
  headerText,
  bodyText,
  sections,
}: {
  phoneNumberId: string;
  to: string;
  headerText: string;
  bodyText: string;
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
}): Promise<void> {
  try {
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
            type: "list",
            header: {
              type: "text",
              text: headerText,
            },
            body: {
              text: bodyText,
            },
            action: {
              button: "View Options",
              sections,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[WhatsApp List] Send failed:", error);
    } else {
      console.log("[WhatsApp List] Sent successfully");
    }
  } catch (error) {
    console.error("[WhatsApp List] Error:", error);
  }
}

/**
 * Send a message with an image
 */
export async function sendWhatsAppImage({
  phoneNumberId,
  to,
  imageUrl,
  caption,
}: {
  phoneNumberId: string;
  to: string;
  imageUrl: string;
  caption?: string;
}): Promise<void> {
  try {
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
          type: "image",
          image: {
            link: imageUrl,
            caption: caption || "",
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[WhatsApp Image] Send failed:", error);
    }
  } catch (error) {
    console.error("[WhatsApp Image] Error:", error);
  }
}

/**
 * Send a location (e.g., hospital location)
 */
export async function sendWhatsAppLocation({
  phoneNumberId,
  to,
  latitude,
  longitude,
  name,
  address,
}: {
  phoneNumberId: string;
  to: string;
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}): Promise<void> {
  try {
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
          type: "location",
          location: {
            latitude,
            longitude,
            name,
            address,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[WhatsApp Location] Send failed:", error);
    }
  } catch (error) {
    console.error("[WhatsApp Location] Error:", error);
  }
}