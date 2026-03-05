// app/api/whatsapp/subscribe/route.ts

import { NextResponse } from "next/server";

export async function POST() {
  try {
    const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    const response = await fetch(
      `https://graph.facebook.com/v25.0/${WABA_ID}/subscribed_apps`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    console.log("WABA subscription response:", data);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Subscription failed" },
      { status: 500 }
    );
  }
}

// GET - Check current subscription status
export async function GET() {
  try {
    const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    const response = await fetch(
      `https://graph.facebook.com/v25.0/${WABA_ID}/subscribed_apps`,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
      }
    );

    const data = await response.json();
    console.log("WABA subscription status:", data);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check subscription" },
      { status: 500 }
    );
  }
}