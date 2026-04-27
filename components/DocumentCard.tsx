"use client"

import Link from "next/link"
import { ExternalLink, Trash2, Download } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface Category {
  categoryId: string
  name: string
  subcategories: string[]
}

interface DocumentCardProps {
  document: {
    id: string
    title: string
    description: string | null
    category: string
    subcategory: string
    period: string | null
    identifier: string | null  // Può essere null
    thumbnail: string
    images: Array<{
      url: string
    }>
  }
  categories?: Category[]
  isAdmin?: boolean
}

export default function DocumentCard({ document, categories = [], isAdmin = false }: DocumentCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Trova il nome della categoria dal categoryId
  const categoryName = categories.find(cat => cat.categoryId === document.category)?.name || document.category

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm(`Sei sicuro di voler eliminare "${document.title}"?\n\nQuesta azione è irreversibile.`)) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Errore durante l'eliminazione")
      }

      // Ricarica la pagina
      window.location.reload()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Errore durante l'eliminazione")
      setIsDeleting(false)
    }
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!document.images || document.images.length === 0) {
      alert("Nessun file disponibile per il download")
      return
    }

    setIsDownloading(true)

    try {
      const fileUrl = document.images[0].url
      
      // Estrai il nome del file dall'URL
      const urlParts = fileUrl.split('/')
      const filename = urlParts[urlParts.length - 1].split('?')[0] || 'download'

      // Apri il file in una nuova finestra per il download
      const link = window.document.createElement('a')
      link.href = fileUrl
      link.download = filename
      link.target = '_blank'
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
    } catch (error) {
      alert("Errore durante il download del file")
    } finally {
      setIsDownloading(false)
    }
  }
  // Determina il tipo di file
  const getFileType = () => {
    const thumbnail = document.thumbnail?.toLowerCase()
    const firstImageUrl = document.images[0]?.url?.toLowerCase()
    
    // PDF
    if (thumbnail?.endsWith('.pdf') || firstImageUrl?.endsWith('.pdf')) {
      return 'pdf'
    }
    
    // Video
    if (thumbnail?.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|m4v)$/) || 
        firstImageUrl?.match(/\.(mp4|webm|ogg|avi|mov|wmv|flv|m4v)$/)) {
      return 'video'
    }
    
    // Audio
    if (thumbnail?.match(/\.(mp3|wav|ogg|aac|m4a|flac|wma)$/) || 
        firstImageUrl?.match(/\.(mp3|wav|ogg|aac|m4a|flac|wma)$/)) {
      return 'audio'
    }
    
    // Verifica se non c'è immagine (usa placeholder)
    if (!document.thumbnail || 
        document.thumbnail === '/no-image-placeholder.svg' ||
        document.thumbnail === '' ||
        document.images.length === 0) {
      return 'no-image'
    }
    
    return 'image'
  }

  const fileType = getFileType()
  const isPDF = fileType === 'pdf'
  const isVideo = fileType === 'video'
  const isAudio = fileType === 'audio'
  const hasNoImage = fileType === 'no-image'
  
  return (
    <div className="group overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-shadow hover:shadow-md">
      {/* Link per la navigazione - esclude i pulsanti admin */}
      <Link href={`/viewer/${document.id}`} className="block">
        {/* Thumbnail */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
          {isPDF ? (
            // Anteprima stilizzata per PDF
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 p-4">
              <div className="rounded-lg bg-white dark:bg-gray-800 shadow-lg p-6 border-2 border-red-200 dark:border-red-800">
                <svg className="h-16 w-16 text-red-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 3v6h6" />
                </svg>
                <div className="text-center">
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full">PDF</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500 text-center">Documento PDF</p>
            </div>
          ) : isVideo ? (
            // Anteprima per Video
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50 p-4">
              <div className="rounded-lg bg-white dark:bg-gray-800 shadow-lg p-6 border-2 border-purple-200 dark:border-purple-800">
                <svg className="h-16 w-16 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <div className="text-center">
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">VIDEO</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500 text-center">File video</p>
            </div>
          ) : isAudio ? (
            // Anteprima per Audio
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 p-4">
              <div className="rounded-lg bg-white dark:bg-gray-800 shadow-lg p-6 border-2 border-green-200 dark:border-green-800">
                <svg className="h-16 w-16 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <div className="text-center">
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">AUDIO</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500 text-center">File audio</p>
            </div>
          ) : hasNoImage ? (
            // Placeholder per documenti senza immagine
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-100 p-4">
              <div className="rounded-lg bg-white dark:bg-gray-800 shadow-lg p-6 border-2 border-gray-300 dark:border-gray-600">
                <svg className="h-16 w-16 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="text-center">
                  <span className="text-xs font-bold text-gray-500 bg-gray-200 px-3 py-1 rounded-full">Solo testo</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500 text-center">Immagine non disponibile</p>
            </div>
          ) : (
            // Immagine normale
            <img
              src={document.thumbnail || document.images[0]?.url || '/placeholder.jpg'}
              alt={document.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category & Subcategory Badges */}
          <div className="mb-2 flex gap-2 flex-wrap">
            <span className="inline-block rounded-full bg-yellow-400 px-3 py-1 text-xs font-medium text-gray-900">
              {categoryName}
            </span>
            <span className="inline-block rounded-full bg-gray-200 dark:bg-gray-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
              {document.subcategory.charAt(0).toUpperCase() + document.subcategory.slice(1)}
            </span>
            {isPDF && (
              <span className="inline-block rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white">
                PDF
              </span>
            )}
            {isVideo && (
              <span className="inline-block rounded-full bg-purple-500 px-3 py-1 text-xs font-medium text-white">
                VIDEO
              </span>
            )}
            {isAudio && (
              <span className="inline-block rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white">
                AUDIO
              </span>
            )}
            {hasNoImage && !isPDF && !isVideo && !isAudio && (
              <span className="inline-block rounded-full bg-gray-400 px-3 py-1 text-xs font-medium text-white">
                Solo testo
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {document.title}
          </h3>

          {/* Description */}
          {document.description && (
            <p className="mb-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
              {document.description}
            </p>
          )}

          {/* Period (if exists)
          {document.period && (
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{document.period}</p>
          )} */}

          {/* Link icon */}
          <div className="flex items-center justify-end border-t border-gray-100 dark:border-gray-700 pt-2">
            <ExternalLink className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          </div>
        </div>
      </Link>

      {/* Admin Actions - Fuori dal Link */}
      {isAdmin && (
        <div className="p-4 pt-0">
          <div className="flex gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 flex items-center justify-center gap-2 rounded-md bg-blue-600 dark:bg-blue-500 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Scarica file"
            >
              <Download className="h-3 w-3" />
              {isDownloading ? "Download..." : "Download"}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 rounded-md bg-red-600 dark:bg-red-500 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Elimina documento"
            >
              <Trash2 className="h-3 w-3" />
              {isDeleting ? "Eliminazione..." : "Elimina"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
