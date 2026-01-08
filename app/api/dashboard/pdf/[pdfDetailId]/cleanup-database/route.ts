// app/api/dashboard/pdfs/[pdfDetailId]/cleanup-database/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ pdfDetailId: string }> }
) {
  try {
    const { pdfDetailId } = await params;

    if (!pdfDetailId) {
      return NextResponse.json(
        { success: false, error: "Document ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get document
    const { data: document, error: fetchError } = await supabase
      .from("pdf_documents")
      .select("*")
      .eq("id", pdfDetailId)
      .single()

    if (fetchError || !document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      )
    }

    // Check if embeddings are deleted
    if (document.embedded_status !== "deleted") {
      return NextResponse.json(
        { success: false, error: "Document embeddings must be deleted first" },
        { status: 400 }
      )
    }

    // Check if storage file is already deleted
    if (document.upload_file_storage_path) {
      return NextResponse.json(
        { success: false, error: "Storage file must be deleted first" },
        { status: 400 }
      )
    }

    // Delete from Database
    const { error: dbError } = await supabase
      .from("pdf_documents")
      .delete()
      .eq("id", pdfDetailId)

    if (dbError) {
      return NextResponse.json(
        { success: false, error: `Database deletion failed: ${dbError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}