"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Filter, X } from "lucide-react"
import Link from "next/link"
import DocumentCard from "./DocumentCard"

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

interface Image {
  id: string
  url: string
  format: string
  createdAt: string
  transcription: string | null
  keywords: string | null
  notes: string | null
}

interface Document {
  id: string
  title: string
  description: string | null
  type: string
  category: string
  subcategory: string
  period: string | null
  identifier: string | null  // Può essere null
  thumbnail: string
  published: boolean
  createdAt: string
  updatedAt: string
  images: Image[]
  user: {
    name: string | null
    email: string | null
  }
}

interface SearchClientProps {
  documents: Document[]
  categories: Category[]
}

export default function SearchClient({ documents, categories }: SearchClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
  const [showPublishedOnly, setShowPublishedOnly] = useState(false)
  const [showUnpublishedOnly, setShowUnpublishedOnly] = useState(false)
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])

  // Carica i tipi di documento
  useEffect(() => {
    const loadDocumentTypes = async () => {
      try {
        const response = await fetch('/api/document-types')
        if (response.ok) {
          const data = await response.json()
          setDocumentTypes(data)
        }
      } catch (error) {
        console.error('Errore caricamento tipi:', error)
      }
    }
    loadDocumentTypes()
  }, [])

  // Ottieni le sottocategorie della categoria selezionata
  const availableSubcategories = useMemo(() => {
    if (!selectedCategory) return []
    const category = categories.find((cat: Category) => cat.categoryId === selectedCategory)
    return category?.subcategories || []
  }, [selectedCategory, categories])

  // Filtra i documenti
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Filtro per testo
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchTitle = doc.title.toLowerCase().includes(query)
        const matchDescription = doc.description?.toLowerCase().includes(query)
        const matchIdentifier = doc.identifier?.toLowerCase().includes(query) || false
        
        // Cerca anche nei metadati delle immagini
        const matchImageMetadata = doc.images.some(img => {
          const matchTranscription = img.transcription?.toLowerCase().includes(query)
          const matchKeywords = img.keywords?.toLowerCase().includes(query)
          const matchNotes = img.notes?.toLowerCase().includes(query)
          return matchTranscription || matchKeywords || matchNotes
        })
        
        if (!matchTitle && !matchDescription && !matchIdentifier && !matchImageMetadata) return false
      }

      // Filtro per categoria
      if (selectedCategory && doc.category !== selectedCategory) return false

      // Filtro per sottocategoria
      if (selectedSubcategory && doc.subcategory !== selectedSubcategory) return false

      // Filtro per tipo
      if (selectedType && doc.type !== selectedType) return false

      // Filtro per periodo
      if (selectedPeriod && doc.period !== selectedPeriod) return false

      // Filtro per stato pubblicazione
      if (showPublishedOnly && !doc.published) return false
      if (showUnpublishedOnly && doc.published) return false

      return true
    })
  }, [documents, searchQuery, selectedCategory, selectedSubcategory, selectedType, selectedPeriod, showPublishedOnly, showUnpublishedOnly])

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("")
    setSelectedSubcategory("")
    setSelectedType("")
    setSelectedPeriod("")
    setShowPublishedOnly(false)
    setShowUnpublishedOnly(false)
  }

  const activeFiltersCount = [
    searchQuery,
    selectedCategory,
    selectedSubcategory,
    selectedType,
    selectedPeriod,
    showPublishedOnly,
    showUnpublishedOnly
  ].filter(Boolean).length

  return (
    <div>
      {/* Filtri */}
      <div className="mb-6 rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Filter className="h-5 w-5" />
            Filtri di Ricerca
          </h2>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white"
            >
              <X className="h-4 w-4" />
              Cancella tutti ({activeFiltersCount})
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Ricerca testuale */}
          <div className="md:col-span-2 lg:col-span-3">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ricerca per testo
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca per titolo, descrizione, identificativo, trascrizioni, keywords..."
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setSelectedSubcategory("")
              }}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tutte</option>
              {categories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sottocategoria */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sottocategoria
            </label>
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              disabled={!selectedCategory}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Tutte</option>
              {availableSubcategories.map((sub: string) => (
                <option key={sub} value={sub}>
                  {sub.charAt(0).toUpperCase() + sub.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo documento */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipologia
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tutte</option>
              {documentTypes.map((type) => (
                <option key={type.id} value={type.typeId}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Periodo */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Periodo
            </label>
            <input
              type="text"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              placeholder="Es: 1800-1900"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Checkbox pubblicazione */}
        <div className="mt-4 flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPublishedOnly}
              onChange={(e) => {
                setShowPublishedOnly(e.target.checked)
                if (e.target.checked) setShowUnpublishedOnly(false)
              }}
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Solo pubblicati</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showUnpublishedOnly}
              onChange={(e) => {
                setShowUnpublishedOnly(e.target.checked)
                if (e.target.checked) setShowPublishedOnly(false)
              }}
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Solo bozze</span>
          </label>
        </div>
      </div>

      {/* Risultati */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Risultati: {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 'i' : 'o'}
        </h2>
      </div>

      {filteredDocuments.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDocuments.map((doc) => (
            <DocumentCard key={doc.id} document={doc} categories={categories} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-white dark:bg-gray-800 p-12 text-center shadow">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500">Nessun documento corrisponde ai criteri di ricerca</p>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700"
            >
              Cancella tutti i filtri
            </button>
          )}
        </div>
      )}
    </div>
  )
}

