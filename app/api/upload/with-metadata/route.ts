import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { uploadFile, generateStoragePath } from "@/lib/storage"
import { prisma } from "@/lib/prisma"
import sharp from 'sharp'

export const maxDuration = 300; // 5 minuti

/**
 * Genera i metadati XMP in formato XML da inserire nell'immagine
 */
function generateXMPMetadata(metadata: {
  title?: string
  description?: string
  author?: string
  category?: string
  subcategory?: string
  period?: string
  location?: string
  collocationLocation?: string
  identifier?: string
  keywords?: string[]
  provenance?: string
  conditions?: string
  materials?: string
  dimensions?: string
  notes?: string
  transcription?: string
}): string {
  const keywords = metadata.keywords?.join(', ') || ''
  
  return `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Digiteca IIIF">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:xmp="http://ns.adobe.com/xap/1.0/"
        xmlns:iptc="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/"
        xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
        xmlns:exif="http://ns.adobe.com/exif/1.0/"
        xmlns:digiteca="http://digiteca.local/ns/1.0/">
      
      <!-- Dublin Core -->
      <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${escapeXml(metadata.title || '')}</rdf:li></rdf:Alt></dc:title>
      <dc:description><rdf:Alt><rdf:li xml:lang="x-default">${escapeXml(metadata.description || '')}</rdf:li></rdf:Alt></dc:description>
      <dc:creator><rdf:Seq><rdf:li>${escapeXml(metadata.author || '')}</rdf:li></rdf:Seq></dc:creator>
      <dc:subject><rdf:Bag>${metadata.keywords?.map(k => `<rdf:li>${escapeXml(k)}</rdf:li>`).join('') || ''}</rdf:Bag></dc:subject>
      <dc:identifier>${escapeXml(metadata.identifier || '')}</dc:identifier>
      <dc:source>${escapeXml(metadata.provenance || '')}</dc:source>
      
      <!-- IPTC -->
      <iptc:Location>${escapeXml(metadata.location || '')}</iptc:Location>
      <digiteca:collocationLocation>${escapeXml(metadata.collocationLocation || '')}</digiteca:collocationLocation>
      <photoshop:Category>${escapeXml(metadata.category || '')}</photoshop:Category>
      <photoshop:SupplementalCategories><rdf:Bag><rdf:li>${escapeXml(metadata.subcategory || '')}</rdf:li></rdf:Bag></photoshop:SupplementalCategories>
      
      <!-- EXIF UserComment con tutti i metadati -->
      <exif:UserComment>Titolo: ${escapeXml(metadata.title || '')} | Autore: ${escapeXml(metadata.author || '')} | Categoria: ${escapeXml(metadata.category || '')}/${escapeXml(metadata.subcategory || '')} | Periodo: ${escapeXml(metadata.period || '')} | Luogo: ${escapeXml(metadata.location || '')} | Collocazione: ${escapeXml(metadata.collocationLocation || '')} | ID: ${escapeXml(metadata.identifier || '')}</exif:UserComment>
      
      <!-- Metadati personalizzati Digiteca -->
      <digiteca:period>${escapeXml(metadata.period || '')}</digiteca:period>
      <digiteca:materials>${escapeXml(metadata.materials || '')}</digiteca:materials>
      <digiteca:dimensions>${escapeXml(metadata.dimensions || '')}</digiteca:dimensions>
      <digiteca:conditions>${escapeXml(metadata.conditions || '')}</digiteca:conditions>
      <digiteca:provenance>${escapeXml(metadata.provenance || '')}</digiteca:provenance>
      <digiteca:transcription>${escapeXml(metadata.transcription || '')}</digiteca:transcription>
      <digiteca:notes>${escapeXml(metadata.notes || '')}</digiteca:notes>
      
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

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
    
    // Metadati del documento da inserire nell'immagine
    const title = formData.get('title') as string || ''
    const description = formData.get('description') as string || ''
    const author = formData.get('author') as string || ''
    const category = formData.get('category') as string || ''
    const subcategory = formData.get('subcategory') as string || ''
    const period = formData.get('period') as string || ''
    const location = formData.get('location') as string || ''
    const collocationLocation = formData.get('collocationLocation') as string || ''
    const identifier = formData.get('identifier') as string || ''
    const keywordsStr = formData.get('keywords') as string || ''
    const provenance = formData.get('provenance') as string || ''
    const conditions = formData.get('conditions') as string || ''
    const materials = formData.get('materials') as string || ''
    const dimensions = formData.get('dimensions') as string || ''
    const notes = formData.get('notes') as string || ''
    const transcription = formData.get('transcription') as string || ''
    const status = formData.get('status') as string || 'bozza'

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
    let buffer: Buffer = Buffer.from(bytes)

    // Genera i metadati XMP
    const keywords = keywordsStr ? keywordsStr.split(',').map(k => k.trim()) : []
    const xmpData = generateXMPMetadata({
      title,
      description,
      author,
      category,
      subcategory,
      period,
      location,
      collocationLocation,
      identifier,
      keywords,
      provenance,
      conditions,
      materials,
      dimensions,
      notes,
      transcription
    })

    // Determina il formato dell'immagine
    const metadata = await sharp(buffer).metadata()
    const format = metadata.format || 'png'

    // Crea il commento EXIF con TUTTI i metadati, inclusi trascrizione, keywords e note
    let exifComment = `Titolo: ${title || 'N/A'}`
    exifComment += ` | Autore: ${author || 'N/A'}`
    exifComment += ` | Descrizione: ${description || 'N/A'}`
    exifComment += ` | Categoria: ${category}/${subcategory}`
    exifComment += ` | Periodo: ${period || 'N/A'}`
    exifComment += ` | Luogo: ${location || 'N/A'}`
    exifComment += ` | Collocazione: ${collocationLocation || 'N/A'}`
    exifComment += ` | ID: ${identifier || 'N/A'}`
    exifComment += ` | Materiali: ${materials || 'N/A'}`
    exifComment += ` | Dimensioni: ${dimensions || 'N/A'}`
    exifComment += ` | Condizioni: ${conditions || 'N/A'}`
    exifComment += ` | Provenienza: ${provenance || 'N/A'}`
    if (keywords.length > 0) {
      exifComment += ` | Parole chiave: ${keywords.join(', ')}`
    }
    if (notes) {
      exifComment += ` | Note: ${notes}`
    }
    if (transcription) {
      exifComment += ` | Trascrizione: ${transcription}`
    }

    // Costruisci l'oggetto EXIF solo con i campi non vuoti
    const exifIFD0: Record<string, string> = {
      Copyright: `© ${new Date().getFullYear()} Digiteca`,
      Software: 'Digiteca IIIF Platform',
    }
    
    if (description || title) exifIFD0.ImageDescription = description || title
    if (author) exifIFD0.Artist = author
    if (title) exifIFD0.DocumentName = title

    // Inserisci i metadati nell'immagine usando Sharp
    let processedImage = sharp(buffer)
      .withMetadata({
        exif: {
          IFD0: exifIFD0,
          IFD2: {
            UserComment: exifComment
          }
        }
      })

    // Converti nel formato appropriato preservando i metadati
    let outputBuffer: Buffer
    if (format === 'jpeg' || format === 'jpg') {
      outputBuffer = Buffer.from(await processedImage.jpeg({ quality: 95 }).toBuffer())
    } else if (format === 'png') {
      outputBuffer = Buffer.from(await processedImage.png().toBuffer())
    } else if (format === 'webp') {
      outputBuffer = Buffer.from(await processedImage.webp({ quality: 95 }).toBuffer())
    } else if (format === 'tiff') {
      outputBuffer = Buffer.from(await processedImage.tiff().toBuffer())
    } else {
      // Fallback a PNG per formati non supportati
      outputBuffer = Buffer.from(await processedImage.png().toBuffer())
    }

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
    const publicUrl = await uploadFile(outputBuffer, storagePath, file.type)

    // Ottieni le dimensioni reali dell'immagine
    const finalMetadata = await sharp(outputBuffer).metadata()

    // NON creiamo più il record Image qui - sarà creato dal client
    // con tutti i metadati completi (transcription, keywords, notes, page_number, order)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: storagePath,
      width: finalMetadata.width || 0,
      height: finalMetadata.height || 0,
      format: format,
      metadataInjected: true,
      exifComment
    })

  } catch (error) {
    console.error('Errore upload file con metadati:', error)
    return NextResponse.json(
      { error: "Errore durante l'upload del file" },
      { status: 500 }
    )
  }
}
