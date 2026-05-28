import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import MiradorViewer from "@/components/MiradorViewer"
import PDFViewer from "@/components/PDFViewer"
import VideoViewer from "@/components/VideoViewer"
import AudioViewer from "@/components/AudioViewer"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { auth } from "@/auth"

export default async function ViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { order: 'asc' }
      }
    }
  })

  if (!document) {
    notFound()
  }

  // Controlla se l'utente è admin
  let isAdmin = false
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    isAdmin = user?.role === 'admin'
  }

  // Solo gli admin possono vedere documenti non pubblicati
  if (!document.published && !isAdmin) {
    notFound()
  }

  // Determina il tipo di file dalla prima immagine
  const firstImage = document.images[0]
  
  // Funzione per determinare il tipo di file
  const getFileType = (image: any) => {
    if (!image) return 'unknown'
    
    const url = image.url.toLowerCase()
    const format = image.format?.toLowerCase()
    
    // PDF
    if (format === 'pdf' || url.endsWith('.pdf')) {
      return 'pdf'
    }
    
    // Video
    if (format && ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'm4v'].includes(format)) {
      return 'video'
    }
    if (url.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|m4v)$/)) {
      return 'video'
    }
    
    // Audio
    if (format && ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'wma'].includes(format)) {
      return 'audio'
    }
    if (url.match(/\.(mp3|wav|ogg|aac|m4a|flac|wma)$/)) {
      return 'audio'
    }
    
    // Immagini (default per IIIF/Mirador)
    return 'image'
  }

  const fileType = getFileType(firstImage)
  const manifestUrl = `/api/iiif/${document.id}/manifest.json`

  // Determina l'URL di ritorno in base al ruolo
  const backUrl = isAdmin ? '/admin/search' : '/'

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href={backUrl}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Torna all'archivio</span>
          </Link>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{document.title}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">ID: {document.identifier}</p>
          </div>
        </div>
        <Link href={backUrl} className="flex items-center gap-3">
          <Image src="/logo.jpg" alt="Digiteca Logo" width={300} height={100} className="h-16 w-auto" priority />
          <span className="text-xl font-semibold text-gray-800 dark:text-gray-200">Città di Caiazzo</span>
        </Link>
      </header>

      {/* Viewer */}
      <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
        {document.images.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-bold text-red-600 dark:text-red-400">⚠️ Nessun file trovato</p>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Il documento non ha file associati</p>
            </div>
          </div>
        ) : fileType === 'pdf' && firstImage ? (
          <PDFViewer 
            pdfUrl={firstImage.url} 
            documentTitle={document.title}
          />
        ) : fileType === 'video' && firstImage ? (
          <VideoViewer 
            videoUrl={firstImage.url} 
            documentTitle={document.title}
          />
        ) : fileType === 'audio' && firstImage ? (
          <AudioViewer 
            audioUrl={firstImage.url} 
            documentTitle={document.title}
          />
        ) : fileType === 'image' ? (
          <MiradorViewer 
            manifestUrl={manifestUrl}
            documentTitle={document.title}
            documentId={document.id}
            images={document.images}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-bold text-red-600 dark:text-red-400">⚠️ Visualizzatore non disponibile</p>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Tipo di file: <strong>{fileType}</strong>
              </p>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Formato non supportato per la visualizzazione
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
