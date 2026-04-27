import { NextRequest, NextResponse } from 'next/server'
import { generateSignedUploadUrl, generateStoragePath } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { filename, contentType, metadata } = body

    if (!filename || !contentType || !metadata) {
      return NextResponse.json(
        { error: 'Parametri mancanti' },
        { status: 400 }
      )
    }

    // Genera il path per il file
    const path = generateStoragePath({
      category: metadata.category,
      subcategory: metadata.subcategory,
      period: metadata.period,
      status: metadata.status,
      createdAt: new Date(),
      filename,
    })

    // Genera il Signed URL
    const { signedUrl, publicUrl } = await generateSignedUploadUrl(path, contentType)

    return NextResponse.json({
      signedUrl,
      publicUrl,
      path,
    })
  } catch (error) {
    console.error('Errore generazione Signed URL:', error)
    return NextResponse.json(
      { error: 'Errore generazione Signed URL' },
      { status: 500 }
    )
  }
}
