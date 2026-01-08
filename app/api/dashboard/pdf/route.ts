// api/dashboard/pdfs/route.ts

import { createClient } from "@/lib/supabase/server";
import { embedAndUpsert } from "@/lib/rag/embedAndUpsert";
import { loadPDF } from "@/lib/pdf/pdfLoader";
import { DEFAULT_NAMESPACE } from "@/lib/pinecone/pineconeClient";
import { NextRequest, NextResponse } from "next/server";
import { createSSEResponse } from "@/lib/utils/sse";
import { getSafeFileName } from "@/lib/utils/utils";

export const runtime = "nodejs";

// GET endpoint to list PDFs with pagination and search
async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 8; // Fixed at 8 results per page
    const search = searchParams.get("search") || "";

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("pdf_documents")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Add search filter if provided
    if (search) {
      query = query.ilike("pdf_name", `%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Database query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch PDFs" },
        { status: 500 }
      );
    }

    // Transform data to match frontend interface
    const pdfs =
      data?.map((doc) => ({
        id: doc.id,
        name: doc.pdf_name,
        size: doc.file_size,
        uploadedAt: doc.created_at,
        isEmbedded: doc.embedded_status === "embedded",
        pages: doc.document_pages || 0,
        chunks: doc.document_chunks || 0,
        url: doc.pdf_url,
      })) || [];

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: pdfs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("GET API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



export { GET };
