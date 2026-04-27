import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { generateUniqueIdentifier } from "@/lib/identifier"

export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      where: { published: true },
      include: {
        images: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(documents)
  } catch (error) {
    return NextResponse.json({ error: "Errore nel recupero dei documenti" }, { status: 500 })
  }
}

// POST - Solo per admin
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
    }

    // Verifica se l'utente è admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: "Accesso negato - solo admin" }, { status: 403 })
    }

    const body = await request.json()
    const { 
      title, description, type, category, subcategory, period, identifier, 
      thumbnail, manifestUrl, images,
      author, attribution, license, ccType, location, date, materials, dimensions, conditions, provenance 
    } = body

    // Validazione
    if (!title || !category || !subcategory) {
      return NextResponse.json(
        { error: "Campi obbligatori mancanti" },
        { status: 400 }
      )
    }

    // Genera automaticamente l'identificativo se non è stato fornito
    let finalIdentifier = identifier
    if (!finalIdentifier || finalIdentifier.trim() === '') {
      finalIdentifier = await generateUniqueIdentifier(category, subcategory)
      console.log('🔑 Identificativo generato automaticamente:', finalIdentifier)
    } else {
      // Se l'identifier è stato fornito manualmente, verifica che non esista già
      const existingDoc = await prisma.document.findUnique({
        where: { identifier: finalIdentifier }
      })

      if (existingDoc) {
        return NextResponse.json(
          { error: `Un documento con identificativo "${finalIdentifier}" esiste già. Usa un identificativo univoco.` },
          { status: 400 }
        )
      }
    }

    // Crea il documento con le immagini
    const document = await prisma.document.create({
      data: {
        title,
        description,
        type: type || 'documento-testuale', // Default a documento testuale
        category,
        subcategory,
        period,
        identifier: finalIdentifier, // Usa l'identificativo generato o fornito
        
        // Nuovi campi metadati con valori di default
        author: author || '',
        attribution: attribution || '',
        license: license || 'tutti-i-diritti-riservati',
        ccType: ccType || '',
        location: location || '',
        century: date || '',
        materials: materials || '',
        dimensions: dimensions || '',
        conditions: conditions || '',
        provenance: provenance || '',
        
        thumbnail: thumbnail || '',
        manifestUrl: manifestUrl || '', // Può essere vuoto per documenti temporanei
        userId: user.id,
        images: {
          create: images?.map((img: any, index: number) => ({
            url: img.url,
            width: img.width || 0,
            height: img.height || 0,
            format: img.format || 'jpg',
            order: index
          })) || []
        }
      },
      include: {
        images: true
      }
    })

    // Invalida la cache della homepage se il documento è pubblicato
    // (per documenti temporanei sarà false, quindi non invalida)
    if (body.published) {
      revalidatePath('/')
    }

    return NextResponse.json(document, { status: 201 })
  } catch (error: any) {
    console.error('Errore nella creazione del documento:', error)
    
    // Gestisci errore di unicità
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Un documento con questo identificativo esiste già. Usa un identificativo univoco." },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ error: "Errore nella creazione del documento" }, { status: 500 })
  }
}
