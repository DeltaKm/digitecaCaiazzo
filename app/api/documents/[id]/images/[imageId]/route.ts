import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
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

    const { id, imageId } = await params
    const body = await request.json()

    const updatedImage = await prisma.image.update({
      where: { id: imageId },
      data: {
        transcription: body.transcription,
        keywords: body.keywords,
        notes: body.notes,
      }
    })

    return NextResponse.json(updatedImage)
  } catch (error) {
    console.error('Errore aggiornamento metadati immagine:', error)
    return NextResponse.json(
      { error: 'Errore aggiornamento metadati' },
      { status: 500 }
    )
  }
}
