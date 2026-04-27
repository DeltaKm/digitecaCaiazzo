"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, RotateCw } from "lucide-react"
import DocumentCard from "@/components/DocumentCard"
import { HISTORICAL_PERIODS } from "@/lib/periods"

interface Document {
  id: string
  title: string
  description: string | null
  type: string
  category: string
  subcategory: string
  period: string | null
  identifier: string
  thumbnail: string
  images: Array<{
    url: string
    transcription: string | null
    keywords: string | null
    notes: string | null
  }>
}

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

interface HomeClientProps {
  documents: Document[]
  categories: Category[]
}

export default function HomeClient({ documents, categories }: HomeClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSubcategory, setSelectedSubcategory] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [sortBy, setSortBy] = useState("recent")
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

  // Estrai sottocategorie uniche
  const subcategories = useMemo(() => 
    [...new Set(documents.map(d => d.subcategory))],
    [documents]
  )

  // Filtra e ordina i documenti
  const filteredDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      // Ricerca generale (titolo, descrizione, identificativo, metadati immagini)
      const matchesSearch = searchQuery === "" || (() => {
        const query = searchQuery.toLowerCase()
        
        // Cerca nei campi principali del documento
        const matchTitle = doc.title.toLowerCase().includes(query)
        const matchDescription = doc.description?.toLowerCase().includes(query)
        const matchIdentifier = doc.identifier.toLowerCase().includes(query)
        
        // Cerca nei metadati delle immagini (trascrizione, keywords, note)
        const matchImageMetadata = doc.images.some(img => {
          const matchTranscription = img.transcription?.toLowerCase().includes(query)
          const matchKeywords = img.keywords?.toLowerCase().includes(query)
          const matchNotes = img.notes?.toLowerCase().includes(query)
          return matchTranscription || matchKeywords || matchNotes
        })
        
        return matchTitle || matchDescription || matchIdentifier || matchImageMetadata
      })()

      // Filtro categoria
      const matchesCategory = selectedCategory === "" || doc.category === selectedCategory

      // Filtro sottocategoria
      const matchesSubcategory = selectedSubcategory === "" || doc.subcategory === selectedSubcategory

      // Filtro tipo
      const matchesType = selectedType === "" || doc.type === selectedType

      // Filtro periodo
      const matchesPeriod = selectedPeriod === "" || doc.period === selectedPeriod

      return matchesSearch && matchesCategory && matchesSubcategory && matchesType && matchesPeriod
    })

    // Ordinamento
    switch (sortBy) {
      case "oldest":
        filtered = [...filtered].reverse()
        break
      case "a-z":
        filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title))
        break
      case "z-a":
        filtered = [...filtered].sort((a, b) => b.title.localeCompare(a.title))
        break
      default: // "recent"
        // Già ordinati per createdAt desc
        break
    }

    return filtered
  }, [documents, searchQuery, selectedCategory, selectedSubcategory, selectedType, selectedPeriod, sortBy])

  const handleReset = () => {
    setSearchQuery("")
    setSelectedCategory("")
    setSelectedSubcategory("")
    setSelectedType("")
    setSelectedPeriod("")
    setSortBy("recent")
  }

  return (
    <>
      {/* Search and Filters */}
      <div className="mb-8 rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {/* Ricerca Generale */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ricerca Generale
            </label>
            <input
              type="text"
              placeholder="Cerca titoli, descrizioni, trascrizioni, keywords, note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Tipo documento */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipologia
            </label>
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tutte</option>
              {documentTypes.map(type => (
                <option key={type.id} value={type.typeId}>{type.name}</option>
              ))}
            </select>
          </div>

          {/* Categoria */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Categoria
            </label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tutte</option>
              {categories.map(cat => (
                <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
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
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tutte</option>
              {subcategories.map(sub => (
                <option key={sub} value={sub}>
                  {sub.charAt(0).toUpperCase() + sub.slice(1)}
                </option>
              ))}
            </select>
          </div>

          

          {/* Periodo */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Periodo
            </label>
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tutte</option>
              {HISTORICAL_PERIODS.map(period => (
                <option key={period.value} value={period.value}>{period.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <RotateCw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Risultati della ricerca ({filteredDocuments.length} elementi)
        </h2>
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
        >
          <option value="recent">Più recenti</option>
          <option value="oldest">Più vecchi</option>
          <option value="a-z">A-Z</option>
          <option value="z-a">Z-A</option>
        </select>
      </div>

      {/* Documents Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredDocuments.map((doc) => (
          <DocumentCard key={doc.id} document={doc} categories={categories} />
        ))}
      </div>

      {/* Empty State */}
      {filteredDocuments.length === 0 && (
        <div className="py-12 text-center">
          <Search className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Nessun documento trovato</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Prova a modificare i filtri di ricerca</p>
        </div>
      )}
    </>
  )
}
