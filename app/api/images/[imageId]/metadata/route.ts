import { NextRequest, NextResponse } from "next/server"
import sharp from 'sharp'
import https from 'https'
import http from 'http'
import { Storage } from '@google-cloud/storage'
import { prisma } from "@/lib/prisma"

// Inizializza GCS
const storage = new Storage(
  process.env.GCS_SERVICE_ACCOUNT_KEY
    ? {
        projectId: process.env.GCS_PROJECT_ID,
        credentials: JSON.parse(process.env.GCS_SERVICE_ACCOUNT_KEY),
      }
    : {
        projectId: process.env.GCS_PROJECT_ID,
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || undefined,
      }
)

const bucket = storage.bucket(process.env.GCS_BUCKET || 'digiteca-objects')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params

    // Trova l'immagine nel database
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      include: { document: true }
    })

    if (!image) {
      return NextResponse.json(
        { error: "Immagine non trovata" },
        { status: 404 }
      )
    }

    // Leggi i metadati dall'URL
    const metadata = await new Promise((resolve, reject) => {
      const protocol = image.url.startsWith('https') ? https : http

      protocol.get(image.url, (response) => {
        const chunks: Buffer[] = []
        let totalBytes = 0

        response.on('data', (chunk: Buffer) => {
          chunks.push(chunk)
          totalBytes += chunk.length

          // Limita a 10MB
          if (totalBytes > 10 * 1024 * 1024) {
            response.destroy()
            reject(new Error('Immagine troppo grande (>10MB)'))
            return
          }
        })

        response.on('end', async () => {
          try {
            const buffer = Buffer.concat(chunks)
            const metadata = await sharp(buffer).metadata()
            resolve(metadata)
          } catch (error) {
            reject(error)
          }
        })

        response.on('error', reject)
      }).on('error', reject)
    })

    return NextResponse.json({
      imageId,
      url: image.url,
      documentTitle: image.document.title,
      metadata
    })

  } catch (error) {
    console.error('Errore lettura metadati:', error)
    return NextResponse.json(
      { error: "Errore durante la lettura dei metadati" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params
    const { userComment, customMetadata } = await request.json()

    // Trova l'immagine
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      include: { document: true }
    })

    if (!image) {
      return NextResponse.json(
        { error: "Immagine non trovata" },
        { status: 404 }
      )
    }

    // Scarica l'immagine da GCS
    const file = bucket.file(image.url.split('/').pop()!)
    const [buffer] = await file.download()

    // Crea nuovi metadati EXIF/XMP
    let updatedBuffer = buffer

    if (userComment) {
      // Aggiungi UserComment ai metadati EXIF
      updatedBuffer = await sharp(buffer)
        .withMetadata({
          exif: {
            IFD0: {
              UserComment: userComment
            }
          }
        })
        .png()
        .toBuffer()
    }

    // Ricarica il file su GCS con i nuovi metadati
    await file.save(updatedBuffer, {
      contentType: 'image/png',
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    })

    // Rendi pubblico se necessario
    try {
      await file.makePublic()
    } catch (error) {
      // Ignora errore se Public Access Prevention è attivo
    }

    return NextResponse.json({
      success: true,
      message: "Metadati aggiornati con successo"
    })

  } catch (error) {
    console.error('Errore aggiornamento metadati:', error)
    return NextResponse.json(
      { error: "Errore durante l'aggiornamento dei metadati" },
      { status: 500 }
    )
  }
}