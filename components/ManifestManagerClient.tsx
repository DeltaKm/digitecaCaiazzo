"use client"

import { useState } from "react"
import { FileJson, Copy, Eye, Upload, Save, Image as ImageIcon, Trash2 } from "lucide-react"
import Link from "next/link"

interface Image {
  id: string
  url: string
  width: number
  height: number
  format: string
  order: number
  transcription?: string | null
  keywords?: string | null
  notes?: string | null
  createdAt: string
}

interface Document {
  id: string
  title: string
  description: string | null
  category: string
  subcategory: string
  identifier: string
  thumbnail: string
  manifestUrl: string
  images: Image[]
  createdAt: string
  updatedAt: string
  published: boolean
}

interface ManifestManagerClientProps {
  documents: Document[]
}

export default function ManifestManagerClient({ documents: initialDocuments }: ManifestManagerClientProps) {
  const [documents, setDocuments] = useState(initialDocuments)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [selectedImage, setSelectedImage] = useState<Image | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [editingMetadata, setEditingMetadata] = useState<{
    transcription: string
    keywords: string
    notes: string
  }>({
    transcription: "",
    keywords: "",
    notes: "",
  })

  const handleSelectDocument = (doc: Document) => {
    setSelectedDocument(doc)
    setSelectedImage(null)
  }

  const handleSelectImage = (image: Image) => {
    setSelectedImage(image)
    setEditingMetadata({
      transcription: image.transcription || "",
      keywords: image.keywords || "",
      notes: image.notes || "",
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDocument) return
    
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      console.log('📦 Inizio upload immagine:', file.name)

      // 1. Genera Signed URL
      const signedUrlResponse = await fetch("/api/upload/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: `${selectedDocument.id}_${file.name}`,
          contentType: file.type,
          metadata: {
            category: selectedDocument.category,
            subcategory: selectedDocument.subcategory,
            documentId: selectedDocument.id,
          },
        }),
      })

      const { signedUrl, publicUrl, path } = await signedUrlResponse.json()
      console.log('🔑 Signed URL ottenuto')

      // 2. Upload diretto a GCS
      await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })
      console.log('✅ File caricato su GCS')

      // 3. Rendi pubblico
      await fetch("/api/upload/make-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      })
      console.log('🌍 File reso pubblico')

      // 4. Leggi dimensioni
      const dimensions = await getImageDimensions(file)
      console.log('📐 Dimensioni:', dimensions)

      // 5. Crea record immagine
      const imageResponse = await fetch(`/api/documents/${selectedDocument.id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: publicUrl,
          width: dimensions.width,
          height: dimensions.height,
          format: file.type.split("/")[1] || "jpg",
          order: selectedDocument.images.length,
          transcription: "",
          keywords: "",
          notes: "",
        }),
      })

      const newImage = await imageResponse.json()
      console.log('✅ Immagine creata nel database:', newImage)

      // Aggiorna lo stato locale
      setDocuments(documents.map(doc => 
        doc.id === selectedDocument.id 
          ? { ...doc, images: [...doc.images, newImage] }
          : doc
      ))

      setSelectedDocument({
        ...selectedDocument,
        images: [...selectedDocument.images, newImage]
      })

      alert("✅ Immagine caricata con successo!")
    } catch (error) {
      console.error("❌ Errore upload:", error)
      alert("❌ Errore durante l'upload")
    } finally {
      setIsUploading(false)
    }
  }

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
        URL.revokeObjectURL(img.src)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const handleSaveMetadata = async () => {
    if (!selectedImage || !selectedDocument) return

    try {
      const response = await fetch(`/api/documents/${selectedDocument.id}/images/${selectedImage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingMetadata),
      })

      const updatedImage = await response.json()

      // Aggiorna lo stato locale
      const updatedDoc = {
        ...selectedDocument,
        images: selectedDocument.images.map(img => 
          img.id === updatedImage.id ? updatedImage : img
        )
      }

      setDocuments(documents.map(doc => 
        doc.id === selectedDocument.id ? updatedDoc : doc
      ))

      setSelectedDocument(updatedDoc)
      setSelectedImage(updatedImage)

      alert("✅ Metadati salvati con successo!")
    } catch (error) {
      console.error("❌ Errore salvataggio:", error)
      alert("❌ Errore durante il salvataggio")
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista Documenti - Colonna Sinistra */}
      <div className="lg:col-span-2 space-y-4">
        {documents.map((doc) => {
          const manifestUrl = `${window.location.origin}/api/iiif/${doc.id}/manifest.json`
          
          return (
            <div 
              key={doc.id} 
              className={`rounded-lg bg-white p-6 shadow cursor-pointer transition-all ${
                selectedDocument?.id === doc.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleSelectDocument(doc)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <FileJson className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                    <span className="text-sm text-gray-500">({doc.identifier})</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{doc.description || 'Nessuna descrizione'}</p>
                  
                  <div className="mt-4 rounded-md bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <code className="text-xs text-gray-800 truncate flex-1 mr-4">{manifestUrl}</code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(manifestUrl)
                          alert('✅ URL copiato!')
                        }}
                        className="ml-4 flex items-center gap-2 rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                      >
                        <Copy className="h-4 w-4" />
                        Copia
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-4 text-sm text-gray-500">
                    <span>
                      Categoria: <span className="font-medium">{doc.category}</span> / {doc.subcategory}
                    </span>
                    <span>
                      • {doc.images.length} immagine{doc.images.length !== 1 ? 'i' : ''}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <a
                    href={manifestUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 rounded bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
                  >
                    <Eye className="h-4 w-4" />
                    JSON
                  </a>
                  <Link
                    href={`/viewer/${doc.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 rounded bg-blue-100 px-3 py-2 text-sm text-blue-700 hover:bg-blue-200"
                  >
                    <Eye className="h-4 w-4" />
                    Viewer
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Gestione Immagini - Colonna Destra */}
      <div className="lg:col-span-1">
        {selectedDocument ? (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Gestione Pagine
            </h2>

            <p className="text-sm text-gray-600">{selectedDocument.title}</p>

            {/* Upload Button */}
            <div>
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    isUploading
                      ? "border-gray-300 bg-gray-50"
                      : "border-blue-300 hover:border-blue-500 hover:bg-blue-50"
                  }`}
                >
                  {isUploading ? (
                    <p className="text-gray-600 text-sm">Caricamento...</p>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                      <p className="text-sm text-gray-600">Carica nuova pagina</p>
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* Lista Immagini */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-gray-900">
                Pagine ({selectedDocument.images.length})
              </h3>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedDocument.images.map((image, index) => (
                  <div
                    key={image.id}
                    onClick={() => handleSelectImage(image)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedImage?.id === image.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={image.url}
                        alt={`Pagina ${index + 1}`}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900">
                          Pagina {index + 1}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {image.keywords || "Nessuna parola chiave"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Editor Metadati */}
            {selectedImage && (
              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-sm text-gray-900">
                  Metadati Pagina {selectedDocument.images.findIndex((i) => i.id === selectedImage.id) + 1}
                </h3>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Trascrizione Completa
                  </label>
                  <textarea
                    value={editingMetadata.transcription}
                    onChange={(e) =>
                      setEditingMetadata({
                        ...editingMetadata,
                        transcription: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Scrivi qui il testo della pagina..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Parole Chiave (separate da virgola)
                  </label>
                  <input
                    type="text"
                    value={editingMetadata.keywords}
                    onChange={(e) =>
                      setEditingMetadata({
                        ...editingMetadata,
                        keywords: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="parola1, parola2, parola3"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Note
                  </label>
                  <textarea
                    value={editingMetadata.notes}
                    onChange={(e) =>
                      setEditingMetadata({
                        ...editingMetadata,
                        notes: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Note aggiuntive..."
                  />
                </div>

                <button
                  onClick={handleSaveMetadata}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Save className="w-4 h-4" />
                  Salva Metadati
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-500 text-center">
              Seleziona un documento per gestire le immagini
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
