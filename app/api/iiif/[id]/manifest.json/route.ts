import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getLicenseText, getLicenseName, getLicenseUrl } from "@/lib/licenses"

// Funzione helper per ottenere l'URL base dell'applicazione
function getBaseUrl(request: Request): string {
  // Priorità 1: Usa NEXT_PUBLIC_BASE_URL se definito (per produzione)
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  
  // Priorità 2: In produzione Vercel, usa il dominio Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Priorità 3: Prova a ottenere l'URL dall'header della richiesta
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  
  if (host) {
    return `${protocol}://${host}`
  }
  
  // Fallback a localhost (solo per sviluppo)
  return 'http://localhost:3000'
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const baseUrl = getBaseUrl(request)
    
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

    // Crea il manifest IIIF 3.0
    const manifest: any = {
      "@context": "http://iiif.io/api/presentation/3/context.json",
      "id": `${baseUrl}/api/iiif/${id}/manifest.json`,
      "type": "Manifest",
      "label": {
        "it": [document.title]
      },
      "behavior": ["paged"],
      "metadata": [
        {
          "label": { "it": ["Identificativo"] },
          "value": { "it": [document.identifier] }
        },
        {
          "label": { "it": ["Categoria"] },
          "value": { "it": [document.category] }
        },
        {
          "label": { "it": ["Sottocategoria"] },
          "value": { "it": [document.subcategory] }
        },
        {
          "label": { "it": ["Autore"] },
          "value": { "it": [document.author || "Non specificato"] }
        },
        {
          "label": { "it": ["Licenza"] },
          "value": { "it": [getLicenseName(document.license || 'tutti-i-diritti-riservati')] }
        }
      ],
      "summary": {
        "it": [document.description || ""]
      },
    }

    // Aggiungi requiredStatement (attribution/copyright) sempre
    let attributionText = ''
    
    // Aggiungi attribuzione se presente
    if (document.attribution && document.attribution.trim()) {
      attributionText += document.attribution
    }
    
    // Aggiungi licenza (sempre presente con default)
    const licenseText = getLicenseText(document.license || 'tutti-i-diritti-riservati')
    console.log('📄 Testo licenza generato:', licenseText);
    
    if (attributionText) {
      attributionText += '\n\n---\n\n' + licenseText
    } else {
      attributionText = licenseText
    }
    
    console.log('✅ Attribution text finale:', attributionText);
    
    manifest.requiredStatement = {
      "label": { "it": ["Attribuzione e Licenza"] },
      "value": { "it": [attributionText] }
    }

    // Aggiungi rights URL se disponibile (per licenze standard)
    const rightsUrl = getLicenseUrl(document.license || 'tutti-i-diritti-riservati')
    if (rightsUrl) {
      manifest.rights = rightsUrl
      console.log('✅ Rights URL aggiunto:', rightsUrl);
    }

    // Aggiungi thumbnail e items
    manifest.thumbnail = [
      {
        "id": document.thumbnail,
        "type": "Image",
        "format": "image/jpeg"
      }
    ]
    
    manifest.items = document.images.map((image, index) => {
      // Parse le annotazioni dal JSON (se presenti)
      let imageAnnotations: any[] = []
      try {
        imageAnnotations = image.annotations ? JSON.parse(image.annotations) : []
      } catch (e) {
        console.error('Errore parsing annotazioni:', e)
      }

      const canvas: any = {
        "id": `${baseUrl}/api/iiif/${id}/canvas/${index}`,
        "type": "Canvas",
        "label": {
          "it": [image.label || `Pg ${index + 1}`]
        },
        "height": image.height || 2000,
        "width": image.width || 1500,
        "items": [
          {
            "id": `${baseUrl}/api/iiif/${id}/canvas/${index}/page`,
            "type": "AnnotationPage",
            "items": [
              {
                "id": `${baseUrl}/api/iiif/${id}/canvas/${index}/annotation`,
                "type": "Annotation",
                "motivation": "painting",
                "body": {
                  "id": image.url,
                  "type": "Image",
                  "format": `image/${image.format}`,
                  "height": image.height || 2000,
                  "width": image.width || 1500
                },
                "target": `${baseUrl}/api/iiif/${id}/canvas/${index}`
              }
            ]
          }
        ]
      }

      // Aggiungi metadata specifici per questa pagina/canvas
      if (imageAnnotations.length > 0) {
        // Converti le annotazioni in metadata strutturati
        const metadata: any[] = []
        
        imageAnnotations.forEach((annotation) => {
          if (annotation.label && annotation.value) {
            metadata.push({
              "label": { "it": [annotation.label] },
              "value": { "it": [annotation.value] }
            })
          }
        })
        
        if (metadata.length > 0) {
          canvas.metadata = metadata
        }
      }

      return canvas
    })

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })

  } catch (error) {
    console.error('Errore generazione manifest:', error)
    return NextResponse.json(
      { error: "Errore nella generazione del manifest" },
      { status: 500 }
    )
  }
}
