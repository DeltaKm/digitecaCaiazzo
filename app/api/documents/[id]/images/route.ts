import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    // Crea l'immagine associata al documento
    const image = await prisma.image.create({
      data: {
        documentId: id,
        url: body.url,
        width: body.width || 0,
        height: body.height || 0,
        format: body.format || 'jpg',
        order: body.order || 0,
        pageNumber: body.page_number || null,
        label: body.label || null, // Aggiungi il label personalizzato
        transcription: body.transcription || null,
        keywords: body.keywords || null,
        notes: body.notes || null,
        annotations: body.annotations || '[]' // Aggiungi le annotazioni
      }
    })

    return NextResponse.json(image, { status: 201 })
  } catch (error) {
    console.error('Errore creazione immagine:', error)
    return NextResponse.json(
      { error: 'Errore creazione immagine' },
      { status: 500 }
    )
  }
}
