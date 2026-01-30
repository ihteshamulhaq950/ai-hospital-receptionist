import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { SUPABASE_STORAGE_BUCKET_NAME } from '@/constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { storagePath, fileName, download = false } = await request.json()

    if (!storagePath) {
      return NextResponse.json(
        { error: 'Storage path is required' },
        { status: 400 }
      )
    }

    // Generate signed URL (valid for 60 seconds)
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from(SUPABASE_STORAGE_BUCKET_NAME)
      .createSignedUrl(storagePath, 3600, {
        download: download,
      })

    if (signedUrlError || !signedUrlData) {
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      downloadUrl: signedUrlData.signedUrl,
      fileName,
    })

  } catch (error) {
    console.error('Error in download API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}