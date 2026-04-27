import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { deleteFile } from "@/lib/storage"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: "Documento non trovato" }, { status: 404 })
    }

    return NextResponse.json(document)
  } catch (error) {
    return NextResponse.json({ error: "Errore nel recupero del documento" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 })
    }

    const body = await request.json()
    const { id } = await params
    const document = await prisma.document.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        subcategory: body.subcategory,
        period: body.period,
        identifier: body.identifier,
        thumbnail: body.thumbnail,
        manifestUrl: body.manifestUrl,
        published: body.published
      }
    })

    // Invalida la cache della homepage se il documento è pubblicato
    if (document.published) {
      revalidatePath('/')
    }

    return NextResponse.json(document)
  } catch (error) {
    return NextResponse.json({ error: "Errore aggiornamento" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 })
    }

    const body = await request.json()
    const { id } = await params
    
    // Filtriamo solo i campi che esistono nel modello Prisma
    const allowedFields = [
      'title', 'description', 'category', 'subcategory', 'type',
      'author', 'attribution', 'license', 'ccType', 'location', 'collocationLocation', 'period', 'century', 'materials', 
      'dimensions', 'conditions', 'provenance', 'identifier', 
      'published', 'thumbnail', 'manifestUrl'
    ];
    
    const updateData = Object.keys(body)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {} as any);

    const document = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        images: {
          orderBy: { order: 'asc' }
        }
      }
    })

    // Invalida la cache della homepage se il documento è pubblicato
    if (document.published) {
      revalidatePath('/')
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error("Errore aggiornamento documento:", error);
    return NextResponse.json({ error: "Errore aggiornamento" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 })
    }

    const { id } = await params
    
    // Recupera il documento con le immagini associate
    const document = await prisma.document.findUnique({
      where: { id },
      include: { images: true }
    })

    if (!document) {
      return NextResponse.json({ error: "Documento non trovato" }, { status: 404 })
    }

    // Elimina tutti i file da Google Cloud Storage
    for (const image of document.images) {
      try {
        // Estrai il path dal URL pubblico (es: https://storage.googleapis.com/bucket/path)
        const urlParts = image.url.split('/')
        const bucketIndex = urlParts.indexOf(process.env.GCS_BUCKET!)
        if (bucketIndex !== -1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/')
          await deleteFile(filePath)
          console.log(`✅ File eliminato da GCS: ${filePath}`)
        }
      } catch (error) {
        console.error(`⚠️ Errore eliminazione file da GCS:`, error)
        // Continua anche se l'eliminazione del file fallisce
      }
    }

    // Elimina il documento dal database (cascade eliminerà anche le immagini)
    await prisma.document.delete({ where: { id } })

    // Invalida la cache della homepage
    revalidatePath('/')

    return NextResponse.json({ message: "Documento e file eliminati con successo" })
  } catch (error) {
    console.error('Errore eliminazione documento:', error)
    return NextResponse.json({ error: "Errore eliminazione" }, { status: 500 })
  }
}
