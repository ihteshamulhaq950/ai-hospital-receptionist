import { WHATSAPP_API_URL, WHATSAPP_ACCESS_TOKEN } from "../../constants";


// 3. MESSAGE TEMPLATES (for notifications)
// lib/whatsapp/sendTemplate.ts
// ============================================================================

/**
 * Send a pre-approved WhatsApp template message
 * Templates must be created and approved in Meta Business Manager
 */
export async function sendWhatsAppTemplate({
  phoneNumberId,
  to,
  templateName,
  languageCode = "en",
  components = [],
}: {
  phoneNumberId: string;
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
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
          type: "template",
          template: {
            name: templateName,
            language: {
              code: languageCode,
            },
            components,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[WhatsApp Template] Send failed:", error);
      throw new Error(`Template send failed: ${JSON.stringify(error)}`);
    }

    console.log("[WhatsApp Template] Sent successfully");
  } catch (error) {
    console.error("[WhatsApp Template] Error:", error);
    throw error;
  }
}

// Example: Send appointment reminder template
export async function sendAppointmentReminder(
  phoneNumberId: string,
  to: string,
  patientName: string,
  appointmentDate: string,
  appointmentTime: string
): Promise<void> {
  await sendWhatsAppTemplate({
    phoneNumberId,
    to,
    templateName: "appointment_reminder", // Must be created in Meta
    languageCode: "en",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: patientName },
          { type: "text", text: appointmentDate },
          { type: "text", text: appointmentTime },
        ],
      },
    ],
  });
}