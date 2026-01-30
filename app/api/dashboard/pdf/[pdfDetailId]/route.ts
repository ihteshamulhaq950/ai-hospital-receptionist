// app/api/dashboard/pdf/[pdfDetailId]/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getHospitalNamespace } from "@/lib/pinecone/pineconeClient";
import { SUPABASE_STORAGE_BUCKET_NAME } from "@/constants";

export const runtime = "nodejs";

// GET endpoint for individual PDF
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ pdfDetailId: string }> }
) {
  try {
    const supabase = await createClient();
    const { pdfDetailId } = await params;

    if (!pdfDetailId) {
      return NextResponse.json(
        { success: false, error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Fetch PDF document from database
    const { data: pdf, error } = await supabase
      .from("pdf_documents")
      .select("*")
      .eq("id", pdfDetailId)
      .single();

    if (error || !pdf) {
      return NextResponse.json(
        { success: false, error: "PDF document not found" },
        { status: 404 }
      );
    }

    // Return the document data
    // Frontend will calculate derived fields like pages per chunk, etc.
    return NextResponse.json({
      success: true,
      data: {
        id: pdf.id,
        name: pdf.pdf_name,
        url: pdf.pdf_url,
        size: pdf.file_size,
        mimeType: pdf.mime_type,
        pages: pdf.document_pages,
        chunks: pdf.document_chunks,
        isEmbedded: pdf.embedded_status === 'embedded',
        embeddedStatus: pdf.embedded_status, // 'pending' | 'deleted' | 'embedded '
        hasStorageFile: !!pdf.upload_file_storage_path, // boolean
        uploadedFilePath: pdf.upload_file_storage_path, // string | null
      },
    });
  } catch (error) {
    console.error("Error fetching PDF document:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint for individual PDF
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ pdfDetailId: string }> }
) {
  const { pdfDetailId } = await params;
  const supabase = await createClient();

  console.log("Deleting PDF document with ID:", pdfDetailId);

  if (!pdfDetailId) {
    return NextResponse.json({ error: "PDF ID is required" }, { status: 400 });
  }

  // 1️⃣ Fetch document
  const { data: doc, error } = await supabase
    .from("pdf_documents")
    .select("*")
    .eq("id", pdfDetailId)
    .single();

  console.log("Fetched document for deletion:", doc, error);


  if (!doc || error) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const storagePath = doc.upload_file_storage_path;

  // 2️⃣ PINECONE — HARD GATE
  try {
    const hospitalNamespace = getHospitalNamespace();
    await hospitalNamespace.deleteMany({
      pdfDocumentId: pdfDetailId,
    });

    console.log("Pinecone vectors deleted for document ID:", pdfDetailId);
  } catch {
    return NextResponse.json(
      { error: "Pinecone deletion failed" },
      { status: 500 }
    );
  }

  // 3️⃣ STORAGE
  const { error: storageError } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET_NAME)
    .remove(storagePath ? [storagePath] : []);

  if (storageError) {
    await supabase
      .from("pdf_documents")
      .update({ embedded_status: "deleted" })
      .eq("id", pdfDetailId);


    return NextResponse.json(
      { error: "Storage deletion failed" },
      { status: 500 }
    );
  }

  console.log("Storage deleted for document ID:", pdfDetailId);


  // 4️⃣ DATABASE
  const { error: dbError } = await supabase
    .from("pdf_documents")
    .delete()
    .eq("id", pdfDetailId);

  if (dbError) {
    // ✔ NO ROLLBACK
    // ✔ Just reflect reality in DB
    await supabase
      .from("pdf_documents")
      .update({
        embedded_status: "deleted",
        uploaded_file_storage_path: null
      })
      .eq("id", pdfDetailId);

    return NextResponse.json(
      { error: "Database deletion failed, storage already removed" },
      { status: 500 }
    );
  }

  console.log("Database record deleted for document ID:", pdfDetailId);

  // ✅ SUCCESS
  return NextResponse.json({
    message: "PDF document deleted completely successfully",
  }, { status: 200 });
}
