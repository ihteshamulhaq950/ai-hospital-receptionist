import { NextResponse } from "next/server";

export async function POST() {
  console.log("process.env.PHONE_NUMBER_ID:", process.env.WHATSAPP_PHONE_NUMBER_ID);
  try {
    const response = await fetch(
      `https://graph.facebook.com/v24.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/register`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          pin: process.env.WHATSAPP_PIN,
        }),
      }
    );

    console.log("WhatsApp registration response status:", response.status);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
