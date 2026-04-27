import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET - Ottieni tutti i tipi di documento
export async function GET() {
  try {
    const types = await prisma.documentType.findMany({
      orderBy: { order: 'asc' }
    })
    
    return NextResponse.json(types)
  } catch (error) {
    console.error('❌ Errore GET /api/document-types:', error)
    return NextResponse.json(
      { error: "Errore nel recupero dei tipi di documento" },
      { status: 500 }
    )
  }
}

// POST - Crea un nuovo tipo di documento (solo admin)
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non autenticato" },
        { status: 401 }
      )
    }

    // Verifica se l'utente è admin dal database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: "Accesso negato - solo admin" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { typeId, name, order } = body

    console.log('📝 Tentativo creazione tipo:', { typeId, name, order })

    if (!typeId || !name) {
      console.error('❌ Campi mancanti:', { typeId, name })
      return NextResponse.json(
        { error: "typeId e name sono obbligatori" },
        { status: 400 }
      )
    }

    // Verifica se esiste già
    const existing = await prisma.documentType.findUnique({
      where: { typeId }
    })

    if (existing) {
      console.error('❌ Tipo già esistente:', typeId)
      return NextResponse.json(
        { error: "Tipo già esistente" },
        { status: 400 }
      )
    }

    console.log('✅ Creazione tipo in corso...')

    const documentType = await prisma.documentType.create({
      data: {
        typeId: typeId.toLowerCase(),
        name,
        order: order || 0
      }
    })

    console.log('✅ Tipo creato con successo:', documentType)

    return NextResponse.json(documentType)
  } catch (error: any) {
    console.error('❌ Errore POST /api/document-types:', error)
    
    // Gestisci errori specifici di Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Un tipo con questo ID esiste già" },
        { status: 400 }
      )
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Record non trovato" },
        { status: 404 }
      )
    }
    
    // Errore generico con più dettagli
    const errorMessage = error.message || "Errore nella creazione del tipo"
    console.error('❌ Dettaglio errore:', { 
      message: error.message, 
      code: error.code, 
      meta: error.meta 
    })
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE - Elimina un tipo di documento (solo admin)
export async function DELETE(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non autenticato" },
        { status: 401 }
      )
    }

    // Verifica se l'utente è admin dal database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: "Accesso negato - solo admin" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id } = body
    
    console.log('🗑️ Richiesta DELETE ricevuta con id:', id)

    if (!id) {
      console.error('❌ ID mancante nel body:', body)
      return NextResponse.json(
        { error: "ID mancante" },
        { status: 400 }
      )
    }

    console.log('✅ Eliminazione tipo con id:', id)
    await prisma.documentType.delete({
      where: { id }
    })
    
    console.log('✅ Tipo eliminato con successo')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Errore DELETE /api/document-types:', error)
    return NextResponse.json(
      { error: "Errore nell'eliminazione del tipo" },
      { status: 500 }
    )
  }
}

// PATCH - Aggiorna un tipo di documento (solo admin)
export async function PATCH(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non autenticato" },
        { status: 401 }
      )
    }

    // Verifica se l'utente è admin dal database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: "Accesso negato - solo admin" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { typeId, name, order } = body

    if (!typeId) {
      return NextResponse.json(
        { error: "typeId mancante" },
        { status: 400 }
      )
    }

    const documentType = await prisma.documentType.update({
      where: { typeId },
      data: {
        ...(name && { name }),
        ...(order !== undefined && { order })
      }
    })

    return NextResponse.json(documentType)
  } catch (error) {
    console.error('❌ Errore PATCH /api/document-types:', error)
    return NextResponse.json(
      { error: "Errore nell'aggiornamento del tipo" },
      { status: 500 }
    )
  }
}
