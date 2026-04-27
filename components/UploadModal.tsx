"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { X, Plus } from "lucide-react"
import ImageAnnotationsManager from "./ImageAnnotationsManager"
import PageLabelsManager from "./PageLabelsManager"

interface Category {
  categoryId: string
  name: string
  subcategories: string[]
}

interface DocumentType {
  id: string
  typeId: string
  name: string
  order: number
}

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState<{loaded: number, total: number} | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    type: "documento-testuale", // Nuovo campo
    status: "pubblicato",
    visibility: "pubblico",
    author: "",
    attribution: "",
    license: "tutti-i-diritti-riservati",
    ccType: "", // Tipo specifico di Creative Commons
    location: "",
    collocationLocation: "",
    period: "epoca-moderna",
    date: "",
    materials: "",
    dimensions: "",
    conditions: "",
    provenance: "",
    identifier: "",
    thumbnail: "",
    manifestUrl: "https://example.com/iiif/manifest.json",
    transcription: "", // Trascrizione del testo nell'immagine
    keywords: "", // Parole chiave separate da virgola
    notes: "", // Note aggiuntive
  })

  const [files, setFiles] = useState<File[]>([])
  const [imageAnnotations, setImageAnnotations] = useState<{ [key: number]: { label: string; value: string }[] }>({})
  const [pageLabels, setPageLabels] = useState<{ [key: number]: string }>({})
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  // Carica le categorie dal database
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Categorie caricate:', data)
          setCategories(data)
        } else {
          console.error('❌ Errore caricamento categorie:', response.status)
        }
      } catch (error) {
        console.error('❌ Errore caricamento categorie:', error)
      }
    }
    loadCategories()
  }, [])

  // Carica i tipi di documento dal database
  useEffect(() => {
    const loadDocumentTypes = async () => {
      try {
        const response = await fetch('/api/document-types')
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Tipi di documento caricati:', data)
          setDocumentTypes(data)
        } else {
          console.error('❌ Errore caricamento tipi:', response.status)
        }
      } catch (error) {
        console.error('❌ Errore caricamento tipi:', error)
      }
    }
    loadDocumentTypes()
  }, [])

  // Calcola sottocategorie disponibili (si aggiorna automaticamente quando cambia category o categories)
  const availableSubcategories = useMemo(() => {
    if (!formData.category) return []
    
    const category = categories.find(cat => cat.categoryId === formData.category)
    
    if (!category) {
      console.warn('⚠️ Categoria non trovata:', formData.category, 'Categorie disponibili:', categories.map(c => c.categoryId))
      return []
    }
    
    return category.subcategories || []
  }, [formData.category, categories])

  const handleCategoryChange = (category: string) => {
    // Normalizza a lowercase per matchare con categoryId nel database
    const normalizedCategory = category.toLowerCase()
    console.log('📂 Category changed:', category, '→ normalized:', normalizedCategory)
    setFormData({ 
      ...formData, 
      category: normalizedCategory, 
      subcategory: ""
    })
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  // Funzione per upload con progress tracking
  const uploadWithProgress = (url: string, formData: FormData): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setUploadProgress({ loaded: e.loaded, total: e.total })
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch (err) {
            reject(new Error('Errore parsing risposta'))
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText)
            reject(new Error(error.error || `Errore HTTP ${xhr.status}`))
          } catch {
            reject(new Error(`Errore HTTP ${xhr.status}`))
          }
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Errore di rete durante l\'upload'))
      })

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload annullato'))
      })

      xhr.open('POST', url)
      xhr.send(formData)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMissingFields([])

    // Validazione campi obbligatori
    const required = []
    if (!formData.title.trim()) required.push('title')
    if (!formData.category) required.push('category')
    if (!formData.subcategory) required.push('subcategory')
    // identifier non è più obbligatorio

    if (required.length > 0) {
      setMissingFields(required)
      setError("Compila tutti i campi obbligatori evidenziati in rosso")
      setLoading(false)
      return
    }

    try {
      let thumbnailUrl = ""

      // Se ci sono file, caricali PRIMA su Google Cloud Storage
      if (files.length > 0) {
        // Creiamo un documento temporaneo per avere un ID
        const tempDocResponse = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            tags,
            published: false, // Temporaneamente non pubblicato
            thumbnail: "" // Ancora vuoto
          })
        })

        const tempDocData = await tempDocResponse.json()

        if (!tempDocResponse.ok) {
          throw new Error(tempDocData.error || "Errore durante il caricamento del documento")
        }

        console.log('📄 Documento temporaneo creato:', tempDocData.id)
        console.log('📦 Files da caricare:', files.length, 'files')

        // Cicla su tutti i file e caricali
        for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
          const file = files[fileIndex]
          const fileSize = file.size
          const fileSizeMB = fileSize / (1024 * 1024)
          let publicUrl = '' // URL pubblico del file caricato
          let dimensions = { width: 0, height: 0 }
          
          // Determina il formato in modo intelligente
          let format = 'unknown'
          if (file.type === 'application/pdf') {
            format = 'pdf'
          } else if (file.type.startsWith('video/')) {
            format = file.type.split('/')[1] || 'video'
          } else if (file.type.startsWith('audio/')) {
            format = file.type.split('/')[1] || 'audio'
          } else if (file.type.startsWith('image/')) {
            format = file.type.split('/')[1] || 'image'
          } else {
            // Fallback: estrai dall'estensione del file
            format = file.name.split('.').pop()?.toLowerCase() || 'unknown'
          }

          console.log(`\n📦 Caricamento file ${fileIndex + 1}/${files.length}: ${file.name} (${file.type}, formato: ${format})`)

          // Se il file è > 3MB, usa upload diretto a GCS con Signed URL
          // (Next.js/Vercel hanno un limite di 4MB per il body delle richieste)
          if (fileSizeMB > 3) {
            console.log('🔑 File grande (' + fileSizeMB.toFixed(2) + 'MB), upload diretto a GCS')

            // Per immagini grandi, prova a calcolare dimensioni dal client prima dell'upload
            if (file.type.startsWith('image/')) {
              try {
                const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
                  return new Promise((resolve, reject) => {
                    const img = new Image()
                    const timeout = setTimeout(() => {
                      URL.revokeObjectURL(img.src)
                      reject(new Error('Timeout loading image'))
                    }, 10000)
                    
                    img.onload = () => {
                      clearTimeout(timeout)
                      resolve({ width: img.width, height: img.height })
                      URL.revokeObjectURL(img.src)
                    }
                    img.onerror = () => {
                      clearTimeout(timeout)
                      URL.revokeObjectURL(img.src)
                      reject(new Error('Failed to load image'))
                    }
                    img.src = URL.createObjectURL(file)
                  })
                }
                
                dimensions = await getImageDimensions(file)
                console.log('📐 Dimensioni immagine rilevate dal client:', dimensions)
              } catch (dimError) {
                console.warn('⚠️ Impossibile leggere dimensioni dal client:', dimError)
              }
            }

            //1. Genera path e Signed URL
            const timestamp = Date.now()
            const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
            const filename = `${tempDocData.id}_${timestamp}_${safeFilename}`

            const signedUrlResponse = await fetch("/api/upload/signed-url", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                filename,
                contentType: file.type,
                metadata: {
                  category: formData.category,
                  subcategory: formData.subcategory,
                  period: formData.period || null,
                  status: formData.status,
                }
              })
            })

            if (!signedUrlResponse.ok) {
              const errorData = await signedUrlResponse.json()
              throw new Error(errorData.error || "Errore generazione Signed URL")
            }

            const { signedUrl, publicUrl: uploadedPublicUrl, path } = await signedUrlResponse.json()
            console.log('✅ Signed URL generato:', path)

            // 2. Upload diretto a GCS con progress tracking
            console.log('📤 Upload diretto a GCS...')
            await new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest()

              xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                  setUploadProgress({ loaded: e.loaded, total: e.total })
                }
              })

              xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  console.log('✅ Upload diretto completato')
                  resolve(null)
                } else {
                  reject(new Error(`Errore upload GCS: ${xhr.status}`))
                }
              })

              xhr.addEventListener('error', () => reject(new Error('Errore di rete')))
              xhr.addEventListener('abort', () => reject(new Error('Upload annullato')))

              xhr.open('PUT', signedUrl)
              xhr.setRequestHeader('Content-Type', file.type)
              xhr.send(file)
            })

            setUploadProgress(null)
            publicUrl = uploadedPublicUrl
            console.log('✅ File caricato su GCS:', publicUrl)

            // 3. Rendi pubblico il file
            await fetch("/api/upload/make-public", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path })
            })

            // Il primo file diventa il thumbnail
            if (fileIndex === 0) {
              thumbnailUrl = publicUrl
            }
          } else {
            // File piccolo (<= 3MB): usa endpoint appropriato
            console.log('📤 File piccolo (' + fileSizeMB.toFixed(2) + 'MB), upload normale')
            
            const uploadFormData = new FormData()
            uploadFormData.append('file', file)
            uploadFormData.append('documentId', tempDocData.id)
            uploadFormData.append('title', formData.title)
            uploadFormData.append('description', formData.description)
            uploadFormData.append('author', formData.author)
            uploadFormData.append('category', formData.category)
            uploadFormData.append('subcategory', formData.subcategory)
            uploadFormData.append('period', formData.period || '')
            uploadFormData.append('location', formData.location)
            uploadFormData.append('collocationLocation', formData.collocationLocation)
            uploadFormData.append('identifier', formData.identifier)
            uploadFormData.append('keywords', tags.join(','))
            uploadFormData.append('provenance', formData.provenance)
            uploadFormData.append('conditions', formData.conditions)
            uploadFormData.append('materials', formData.materials)
            uploadFormData.append('dimensions', formData.dimensions)
            uploadFormData.append('notes', formData.notes)
            uploadFormData.append('transcription', formData.transcription)
            uploadFormData.append('status', formData.status)
            uploadFormData.append('order', fileIndex.toString())
            
            // Aggiungi le annotazioni e il label per questa immagine
            const imageAnns = imageAnnotations[fileIndex] || []
            uploadFormData.append('annotations', JSON.stringify(imageAnns))
            
            const imageLabel = pageLabels[fileIndex] || ''
            uploadFormData.append('label', imageLabel)

            // Scegli la route appropriata in base al tipo di file
            const isImage = file.type.startsWith('image/')
            const uploadEndpoint = isImage ? "/api/upload/with-metadata" : "/api/upload"
            
            console.log(`📤 Avvio upload ${isImage ? 'con metadati XMP' : 'standard'} per ${file.type}...`)
            const uploadData = await uploadWithProgress(uploadEndpoint, uploadFormData)
            console.log('✅ File caricato:', uploadData)

            setUploadProgress(null)
            
            // Per immagini: /api/upload/with-metadata restituisce i dati direttamente
            // Per altri file: /api/upload restituisce i dati dentro uploadData.image
            if (isImage) {
              publicUrl = uploadData.url
              dimensions = {
                width: uploadData.width || 0,
                height: uploadData.height || 0
              }
              format = uploadData.format || file.type.split('/')[1] || 'unknown'
            } else {
              // La route /api/upload ha già creato il record Image nel DB
              publicUrl = uploadData.url || uploadData.image?.url
              dimensions = {
                width: uploadData.image?.width || 0,
                height: uploadData.image?.height || 0
              }
              format = uploadData.image?.format || file.type.split('/')[1] || 'unknown'
            }
            
            // Il primo file diventa il thumbnail
            if (fileIndex === 0) {
              thumbnailUrl = publicUrl
            }
          }

          // 2. Crea il record Image nel database SOLO se non è già stato creato
          // (la route /api/upload crea già il record, ma /api/upload/with-metadata no)
          const shouldCreateImageRecord = file.type.startsWith('image/') || fileSizeMB > 3
          
          if (shouldCreateImageRecord) {
            // Ottieni le annotazioni e il label per questa immagine
            const imageAnns = imageAnnotations[fileIndex] || []
            const imageLabel = pageLabels[fileIndex] || null
            
            const imageResponse = await fetch(`/api/documents/${tempDocData.id}/images`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                url: publicUrl,
                width: dimensions.width,
                height: dimensions.height,
                format: format,
                order: fileIndex, // Usa l'indice del file come ordine
                page_number: fileIndex + 1, // Numero di pagina basato su 1
                label: imageLabel, // Nome personalizzato della pagina
                transcription: formData.transcription || null,
                keywords: formData.keywords || null,
                notes: formData.notes || null,
                annotations: JSON.stringify(imageAnns) // Aggiungi le annotazioni in formato JSON
              })
            })

            if (!imageResponse.ok) {
              const errorText = await imageResponse.text()
              console.error('❌ Errore creazione immagine:', errorText)
              throw new Error('Errore durante la creazione del record immagine')
            }
            
            const imageData = await imageResponse.json()
            console.log(`✅ Immagine ${fileIndex + 1}/${files.length} creata:`, imageData)
          } else {
            console.log(`✅ File ${fileIndex + 1}/${files.length} già registrato nel DB dall'API`)
          }
        }

        console.log('📝 Aggiornando documento con thumbnail e manifest...')
        const manifestUrl = `${window.location.origin}/api/iiif/${tempDocData.id}/manifest.json`

        // 1. Aggiorna il documento con thumbnail, manifest e stato
        const updateResponse = await fetch(`/api/documents/${tempDocData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            thumbnail: thumbnailUrl,
            manifestUrl: manifestUrl,
            published: formData.status === "pubblicato"
          })
        })

        const updateData = await updateResponse.json()
        console.log('📄 Risposta aggiornamento documento:', updateData)

        if (!updateResponse.ok) {
          throw new Error(updateData.error || "Errore durante l'aggiornamento del documento")
        }

        console.log('✅ Documento completo - reindirizzamento al viewer')
        
        // Aspetta un attimo per assicurarsi che tutto sia salvato
        await new Promise(resolve => setTimeout(resolve, 500))
        
        router.push(`/viewer/${tempDocData.id}`)
        router.refresh() // Forza il refresh dei dati
      } else {
        // Senza file, crea solo il documento con placeholder
        const placeholderUrl = "/no-image-placeholder.svg"
        
        const docResponse = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            tags,
            thumbnail: placeholderUrl,
            manifestUrl: "", // Nessun manifest senza immagine
            published: formData.status === "pubblicato"
          })
        })

        const docData = await docResponse.json()

        if (!docResponse.ok) {
          throw new Error(docData.error || "Errore durante il caricamento del documento")
        }

        // Crea un record Image fittizio per salvare trascrizione, keywords e note
        if (formData.transcription || formData.keywords || formData.notes) {
          await fetch(`/api/documents/${docData.id}/images`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: placeholderUrl,
              width: 400,
              height: 400,
              format: 'svg',
              order: 0,
              transcription: formData.transcription || null,
              keywords: formData.keywords || null,
              notes: formData.notes || null
            })
          })
        }

        router.push(`/viewer/${docData.id}`)
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il caricamento")
      setUploadProgress(null) // Reset progress in caso di errore
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white dark:bg-gray-800 shadow-xl pointer-events-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Carica Nuovo Documento</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">File</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  File Documento * {files.length > 0 && <span className="text-blue-600">({files.length} file selezionati)</span>}
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  accept="image/*,.pdf,video/*,audio/*,.mp4,.mov,.avi,.wmv,.flv,.webm,.ogg,.mp3,.wav,.aac,.m4a,.flac"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supporta immagini, PDF, video (MP4, MOV, AVI, etc.) e audio (MP3, WAV, etc.). Puoi selezionare più file per creare un documento multi-pagina.
                </p>
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">File selezionati:</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                          <span className="text-gray-700 dark:text-gray-300">
                            {index + 1}. {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const newFiles = files.filter((_, i) => i !== index)
                              setFiles(newFiles)
                            }}
                            className="text-red-600 hover:text-red-800 px-2 py-1 rounded"
                            title="Rimuovi file"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nomi e Metadati per ogni pagina */}
          {files.length > 0 && (
            <div className="space-y-6">
              {/* Nomi delle pagine */}
              <div>
                <PageLabelsManager
                  files={files}
                  labels={pageLabels}
                  onChange={setPageLabels}
                />
              </div>

              {/* Metadati specifici per pagina */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Metadati Specifici per Pagina</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Aggiungi informazioni specifiche per ogni pagina del documento (es: ID, Segnatura, Soggetto produttore, etc.). 
                  Questi metadati verranno visualizzati nel pannello "Informazioni sull'oggetto" del visualizzatore IIIF.
                </p>
                <ImageAnnotationsManager
                  files={files}
                  annotations={imageAnnotations}
                  onChange={setImageAnnotations}
                />
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informazioni Base</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titolo *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value })
                    setMissingFields(missingFields.filter(f => f !== 'title'))
                  }}
                  className={`w-full rounded-md border px-4 py-2 text-gray-900 dark:text-white font-medium placeholder-gray-400 focus:outline-none focus:ring-1 ${
                    missingFields.includes('title')
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Inserisci"
                />
                {missingFields.includes('title') && (
                  <p className="mt-1 text-sm text-red-600">Il titolo è obbligatorio</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrizione
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descrivi"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      handleCategoryChange(e.target.value)
                      setMissingFields(missingFields.filter(f => f !== 'category'))
                    }}
                    className={`w-full rounded-md border px-4 py-2 text-gray-900 dark:text-white font-medium placeholder-gray-400 focus:outline-none focus:ring-1 ${
                      missingFields.includes('category')
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Seleziona</option>
                    {categories.map((cat: Category, index: number) => (
                      <option key={cat.categoryId || `cat-${index}`} value={cat.categoryId}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {missingFields.includes('category') && (
                    <p className="mt-1 text-sm text-red-600">La categoria è obbligatoria</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sottocategoria *
                  </label>
                  <select
                    value={formData.subcategory}
                    onChange={(e) => {
                      setFormData({ ...formData, subcategory: e.target.value })
                      setMissingFields(missingFields.filter(f => f !== 'subcategory'))
                    }}
                    className={`w-full rounded-md border px-4 py-2 text-gray-900 dark:text-white font-medium placeholder-gray-400 focus:outline-none focus:ring-1 disabled:opacity-50 ${
                      missingFields.includes('subcategory')
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    disabled={!formData.category}
                  >
                    <option value="">Seleziona</option>
                    {availableSubcategories.map((sub: string, index: number) => (
                      <option key={`${sub}-${index}`} value={sub}>
                        {sub.charAt(0).toUpperCase() + sub.slice(1)}
                      </option>
                    ))}
                  </select>
                  {missingFields.includes('subcategory') && (
                    <p className="mt-1 text-sm text-red-600">La sottocategoria è obbligatoria</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tipo di Documento */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tipo di Documento</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipologia *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Seleziona</option>
                {documentTypes.map((type) => (
                  <option key={type.id} value={type.typeId}>
                    {type.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Seleziona il tipo di documento: testuale, immagine, foto, video, audio, etc.
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Identificativo
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Opzionale)</span>
            </label>
            <input
              type="text"
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Es: ARC-000123"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Se lasciato vuoto, verrà generato automaticamente in base a categoria (es: ARC-000123)
            </p>
          </div>
          

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Metadati</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Autore
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Nome"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Attribuzione
                  </label>
                  <input
                    type="text"
                    value={formData.attribution}
                    onChange={(e) => setFormData({ ...formData, attribution: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Nome"
                  />
                </div>

                {/* Sezione Copyright e Licenza */}
                <div className="col-span-2 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Copyright e Diritti d'Uso
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo di Licenza *
                      </label>
                      <select
                        value={formData.license}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          license: e.target.value,
                          ccType: e.target.value === 'creative-commons' ? 'cc-by' : '' // Reset o imposta default
                        })}
                        className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="tutti-i-diritti-riservati">Tutti i diritti riservati</option>
                        <option value="creative-commons">Creative Commons (CC)</option>
                        <option value="dominio-pubblico">Dominio Pubblico</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formData.license === 'tutti-i-diritti-riservati' && 'L\'utente può solo visualizzare, non può riutilizzare'}
                        {formData.license === 'creative-commons' && 'Licenza aperta con alcune condizioni'}
                        {formData.license === 'dominio-pubblico' && 'Uso libero, anche commerciale'}
                      </p>
                    </div>

                    {/* Dropdown condizionale per Creative Commons */}
                    {formData.license === 'creative-commons' && (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-300 dark:border-blue-700">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tipo di Creative Commons *
                        </label>
                        <select
                          value={formData.ccType}
                          onChange={(e) => setFormData({ ...formData, ccType: e.target.value })}
                          className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="cc-by">CC BY - Attribuzione</option>
                          <option value="cc-by-sa">CC BY-SA - Attribuzione + Condividi allo stesso modo</option>
                          <option value="cc-by-nc">CC BY-NC - Attribuzione + Non commerciale</option>
                        </select>
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          {formData.ccType === 'cc-by' && (
                            <p>✅ Permette qualsiasi utilizzo, anche commerciale, purché si citi l&apos;autore</p>
                          )}
                          {formData.ccType === 'cc-by-sa' && (
                            <p>✅ Come CC BY, ma le opere derivate devono usare la stessa licenza</p>
                          )}
                          {formData.ccType === 'cc-by-nc' && (
                            <p>✅ Permette l&apos;uso con attribuzione, ma non per scopi commerciali</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Periodo storico
                  </label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                   <option value="">Seleziona periodo</option>
                      <option value="preistoria">Preistoria</option>
                      <option value="età-antica">Età Antica</option>
                      <option value="medioevo">Medioevo</option>
                      <option value="età-moderna">Età Moderna</option>
                      <option value="età-contemporanea">Età Contemporanea</option>
                      <option value="contemporaneo-1960">Contemporaneo dal 1960</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Datazione
                  </label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="es. 1520, XVI secolo, 1500-1550"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Luogo origine/produzione
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Luogo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Luogo collocazione
                  </label>
                  <input
                    type="text"
                    value={formData.collocationLocation}
                    onChange={(e) => setFormData({ ...formData, collocationLocation: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Luogo attuale di conservazione"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Storia e provenienza
                  </label>
                  <textarea
                    value={formData.provenance}
                    onChange={(e) => setFormData({ ...formData, provenance: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={2}
                    placeholder="Storia e provenienza"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Materiali e Tecniche
                  </label>
                  <input
                    type="text"
                    value={formData.materials}
                    onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Materiali e Tecniche"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Misure
                  </label>
                  <input
                    type="text"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="es. 30x40 cm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stato di conservazione
                  </label>
                  <select
                    value={formData.conditions}
                    onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Seleziona</option>
                    <option value="ottimo">Ottimo</option>
                    <option value="buono">Buono</option>
                    <option value="discreto">Discreto</option>
                    <option value="mediocre">Mediocre</option>
                    <option value="critico">Critico</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Metadati dell'Immagine */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Metadati dell'Immagine</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Questi metadati verranno salvati nell'immagine e saranno ricercabili
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trascrizione
                </label>
                <textarea
                  value={formData.transcription}
                  onChange={(e) => setFormData({ ...formData, transcription: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={4}
                  placeholder="Trascrizione del testo nell'immagine..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note / Bibliografia
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  placeholder="Note / Bibliografia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Parole Chiave (Keywords)
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="manoscritto, antico, latino (separate da virgola)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Inserisci parole chiave separate da virgola
                </p>
              </div>

              
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tag e Stato</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tag
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white font-medium placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Aggiungi tag"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="rounded-md bg-blue-600 dark:bg-blue-500 px-4 py-2 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-sm text-blue-800 dark:text-blue-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stato e Visibilità</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stato
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="bozza">Bozza</option>
                    <option value="in-revisione">In Revisione</option>
                    <option value="pubblicato">Pubblicato</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Visibilità
                  </label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="pubblico">Pubblico</option>
                    <option value="riservato">Riservato</option>
                    <option value="privato">Privato</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {uploadProgress && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
              <div className="mb-2 flex justify-between text-sm font-medium text-blue-900">
                <span>Caricamento in corso...</span>
                <span>
                  {((uploadProgress.loaded / uploadProgress.total) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(uploadProgress.loaded / uploadProgress.total) * 100}%` }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-blue-700">
                {(uploadProgress.loaded / (1024 * 1024)).toFixed(2)} MB / {(uploadProgress.total / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
          )}

            

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || uploadProgress !== null}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 dark:bg-blue-500 px-6 py-2.5 text-white hover:bg-blue-700 dark:hover:bg-blue-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (uploadProgress ? "Caricamento..." : "Elaborazione...") : "Carica Documento"}
            </button>
          </div>


        </form>
        </div>
      </div>
    </div>
  )
}

