import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { uploadFile, generateStoragePath } from "@/lib/storage"
import { prisma } from "@/lib/prisma"
import sharp from 'sharp'

export const maxDuration = 300; // 5 minuti

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Non autenticato" },
        { status: 401 }
      )
    }

    // Verifica che l'utente sia admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: "Non autorizzato" },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentId = formData.get('documentId') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const author = formData.get('author') as string
    const category = formData.get('category') as string
    const subcategory = formData.get('subcategory') as string
    const period = formData.get('period') as string | null
    const date = formData.get('date') as string
    const location = formData.get('location') as string
    const collocationLocation = formData.get('collocationLocation') as string
    const identifier = formData.get('identifier') as string
    const keywords = formData.get('keywords') as string
    const provenance = formData.get('provenance') as string
    const conditions = formData.get('conditions') as string
    const materials = formData.get('materials') as string
    const dimensions = formData.get('dimensions') as string
    const notes = formData.get('notes') as string
    const transcription = formData.get('transcription') as string
    const status = formData.get('status') as string
    const order = parseInt(formData.get('order') as string || '0')
    const annotations = formData.get('annotations') as string || '[]' // Aggiungi le annotazioni
    const label = formData.get('label') as string || null // Aggiungi il label personalizzato

    if (!file) {
      return NextResponse.json(
        { error: "Nessun file fornito" },
        { status: 400 }
      )
    }

    if (!documentId || !category || !subcategory) {
      return NextResponse.json(
        { error: "Parametri mancanti" },
        { status: 400 }
      )
    }

    // Converti il file in Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Genera un nome file univoco
    const timestamp = Date.now()
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${documentId}_${timestamp}_${safeFilename}`

    // Genera il path organizzato
    const storagePath = generateStoragePath({
      category,
      subcategory,
      period,
      status,
      createdAt: new Date(),
      filename
    })

    // Upload su Google Cloud Storage
    const publicUrl = await uploadFile(buffer, storagePath, file.type)

    // Determina le dimensioni del file in base al tipo
    let width = 0
    let height = 0
    let format = 'unknown'

    if (file.type.startsWith('image/')) {
      try {
        // Solo per le immagini, usa Sharp per ottenere le dimensioni
        const metadata = await sharp(buffer).metadata()
        width = metadata.width || 0
        height = metadata.height || 0
        format = metadata.format || file.type.split('/')[1] || 'unknown'
      } catch (sharpError) {
        console.warn('Impossibile ottenere metadati immagine con Sharp:', sharpError)
        format = file.type.split('/')[1] || 'unknown'
      }
    } else if (file.type === 'application/pdf') {
      format = 'pdf'
    } else if (file.type.startsWith('video/')) {
      format = file.type.split('/')[1] || 'video'
    } else if (file.type.startsWith('audio/')) {
      format = file.type.split('/')[1] || 'audio'
    } else {
      format = file.name.split('.').pop()?.toLowerCase() || 'unknown'
    }

    // Salva le informazioni nel database
    const image = await prisma.image.create({
      data: {
        documentId,
        url: publicUrl,
        width,
        height,
        format,
        order: order,
        label: label, // Aggiungi il label personalizzato
        transcription: transcription || null,
        keywords: keywords || null,
        notes: notes || null,
        annotations: annotations // Aggiungi le annotazioni
      }
    })

    return NextResponse.json({
      success: true,
      image,
      url: publicUrl,
      path: storagePath
    })

  } catch (error) {
    console.error('Errore upload file:', error)
    return NextResponse.json(
      { error: "Errore durante l'upload del file" },
      { status: 500 }
    )
  }
}
