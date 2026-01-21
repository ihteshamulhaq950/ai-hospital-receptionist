// /api/chat/init/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getChatAuth } from "@/lib/auth/chatAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await getChatAuth();
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.rateLimited ? 429 : 401 }
      );
    }

    const { user, supabase } = auth;

    console.log("User inside init is:", user);
    

    // Parse title from request body (optional)
    const body = await req.json();
    const { title } = body;

    const finalTitle =
      typeof title === "string" && title.trim()
        ? title.trim().slice(0, 120)
        : "New Chat";

    console.log("finalTitle is:", finalTitle);
    

    // Insert → let DB generate id
    // .select() returns the inserted row (including the generated id)
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: user.sub,
        title: finalTitle,
        // created_at will be auto-set if you have a default
      })
      .select("id")      // ← important: return the generated fields
      .single();              // since we insert one row

    if (error) {
      console.error("[chat/init] Insert failed", {
        userId: user.sub,
        errorCode: error.code,
        errorMessage: error.message,
      });

      return NextResponse.json(
        { error: "Failed to create chat session" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "No data returned after insert" },
        { status: 500 }
      );
    }

    // Return the auto-generated sessionId
    return NextResponse.json(
      { sessionId: data.id },
      { status: 201 }
    );

  } catch (err) {
    console.error("[chat:init] Unexpected error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}