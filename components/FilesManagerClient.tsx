"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { ChevronRight, ChevronDown, FolderOpen, Folder, File, Eye, Trash2, Download, LayoutGrid, List, Plus, Edit2, FileType } from "lucide-react"
import AddCategoryModal from "./AddCategoryModal"
import DocumentTypeManagerModal from "./DocumentTypeManagerModal"

interface Category {
  categoryId: string
  name: string
  subcategories: string[]
}

interface Image {
  id: string
  url: string
  format: string
  order: number
  createdAt: string
}

interface Document {
  id: string
  title: string
  description: string | null
  category: string
  subcategory: string
  period: string | null
  identifier: string
  thumbnail: string
  published: boolean
  createdAt: string
  updatedAt: string
  images: Image[]
}

interface FilesManagerClientProps {
  documents: Document[]
  categories: Category[]
}

export default function FilesManagerClient({ documents, categories }: FilesManagerClientProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false)
  const [isDocumentTypeModalOpen, setIsDocumentTypeModalOpen] = useState(false)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set())
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<string | null>(null)
  const [editingCategoryValue, setEditingCategoryValue] = useState("")
  const [editingSubcategoryValue, setEditingSubcategoryValue] = useState("")
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null)
  const [deletingSubcategory, setDeletingSubcategory] = useState<string | null>(null)

  // Helper per ottenere il nome della categoria dall'ID
  const getCategoryName = (categoryId: string): string => {
    const cat = categories.find(c => c.categoryId === categoryId)
    return cat?.name || categoryId
  }

  // Organizza i documenti per categoria e sottocategoria
  const categorizedDocuments = useMemo(() => {
    const structure: Record<string, Record<string, Document[]>> = {}

    // Inizializza TUTTE le categorie e sottocategorie dalle props (dal DB)
    categories.forEach(category => {
      structure[category.categoryId] = {}
      category.subcategories.forEach(subcategory => {
        structure[category.categoryId][subcategory] = []
      })
    })

    // Popola con i documenti esistenti
    documents.forEach(doc => {
      if (structure[doc.category] && structure[doc.category][doc.subcategory] !== undefined) {
        structure[doc.category][doc.subcategory].push(doc)
      }
    })

    return structure
  }, [documents, categories])

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const toggleSubcategory = (key: string) => {
    const newExpanded = new Set(expandedSubcategories)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedSubcategories(newExpanded)
  }

  const expandAll = () => {
    setExpandedCategories(new Set(Object.keys(categorizedDocuments)))
    const allSubs = new Set<string>()
    Object.entries(categorizedDocuments).forEach(([cat, subs]) => {
      Object.keys(subs).forEach(sub => {
        allSubs.add(`${cat}-${sub}`)
      })
    })
    setExpandedSubcategories(allSubs)
  }

  const collapseAll = () => {
    setExpandedCategories(new Set())
    setExpandedSubcategories(new Set())
  }

  const totalFiles = documents.reduce((acc, doc) => acc + doc.images.length, 0)
  const totalCategories = categories.length
  const totalSubcategories = categories.reduce((acc, cat) => acc + cat.subcategories.length, 0)

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!confirm(`Sei sicuro di voler eliminare "${docTitle}"?\n\nQuesta azione è irreversibile e eliminerà anche tutti i file associati.`)) {
      return
    }

    setDeletingIds(prev => new Set(prev).add(docId))

    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Errore durante l'eliminazione")
      }

      // Ricarica la pagina per aggiornare la lista
      window.location.reload()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Errore durante l'eliminazione del documento")
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(docId)
        return newSet
      })
    }
  }

  const handleDownload = async (doc: Document) => {
    if (!doc.images || doc.images.length === 0) {
      alert("Nessun file disponibile per il download")
      return
    }

    setDownloadingIds(prev => new Set(prev).add(doc.id))

    try {
      const fileUrl = doc.images[0].url
      
      // Estrai il nome del file dall'URL
      const urlParts = fileUrl.split('/')
      const filename = urlParts[urlParts.length - 1].split('?')[0] || 'download'

      // Apri il file in una nuova finestra per il download
      const link = window.document.createElement('a')
      link.href = fileUrl
      link.download = filename
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      alert("Errore durante il download del file")
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(doc.id)
        return newSet
      })
    }
  }

  const handleAddCategory = (categoryId: string, categoryName: string, subcategories: string[]) => {
    // TODO: Implementare la logica per aggiungere la categoria al file categories.ts
    // Per ora mostriamo un messaggio
    alert(`Categoria aggiunta!\nID: ${categoryId}\nNome: ${categoryName}\nSottocategorie: ${subcategories.join(", ")}\n\nNota: Per rendere permanente la modifica, aggiungi manualmente la categoria in lib/categories.ts`)
    console.log("Nuova categoria:", { id: categoryId, name: categoryName, subcategories })
  }

  const handleSaveCategory = async (categoryId: string, newName: string) => {
    if (!newName.trim()) return
    
    try {
      const response = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          newName,
          action: 'rename'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Errore aggiornamento categoria')
      }
      
      setEditingCategory(null)
      window.location.reload() // Ricarica per mostrare il nuovo nome
    } catch (error) {
      console.error('❌ Errore:', error)
      alert('Errore durante il salvataggio della categoria')
    }
  }

  const handleSaveSubcategory = async (categoryId: string, oldName: string, newName: string) => {
    if (!newName.trim()) return
    
    try {
      const response = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          subcategoryName: oldName,
          newName,
          action: 'rename_subcategory'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Errore aggiornamento sottocategoria')
      }
      
      setEditingSubcategory(null)
      window.location.reload() // Ricarica per mostrare il nuovo nome
    } catch (error) {
      console.error('❌ Errore:', error)
      alert('Errore durante il salvataggio della sottocategoria')
    }
  }

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    const docsCount = Object.values(categorizedDocuments[categoryId] || {}).reduce(
      (acc, docs) => acc + docs.length, 0
    )
    const subcatsCount = Object.keys(categorizedDocuments[categoryId] || {}).length

    if (!confirm(
      `Sei sicuro di voler eliminare la categoria "${categoryName}"?\n\n` +
      `Questa azione eliminerà:\n` +
      `- ${subcatsCount} sottocategorie\n` +
      `- ${docsCount} documenti\n` +
      `- Tutti i file associati\n\n` +
      `ATTENZIONE: Questa azione è IRREVERSIBILE!`
    )) {
      return
    }

    setDeletingCategory(categoryId)

    try {
      const response = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          action: 'delete'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Errore durante l\'eliminazione della categoria')
      }

      alert('Categoria eliminata con successo!')
      window.location.reload()
    } catch (error) {
      console.error('❌ Errore:', error)
      alert(error instanceof Error ? error.message : 'Errore durante l\'eliminazione della categoria')
      setDeletingCategory(null)
    }
  }

  const handleAddSubcategory = async (categoryId: string) => {
    const subcategoryName = prompt('Inserisci il nome della nuova sottocategoria:')
    
    if (!subcategoryName || !subcategoryName.trim()) {
      return
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          subcategory: subcategoryName.trim()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Errore durante l\'aggiunta della sottocategoria')
      }

      alert(`Sottocategoria "${subcategoryName.trim()}" aggiunta con successo!`)
      window.location.reload()
    } catch (error) {
      console.error('❌ Errore:', error)
      alert(error instanceof Error ? error.message : 'Errore durante l\'aggiunta della sottocategoria')
    }
  }

  const handleDeleteSubcategory = async (categoryId: string, subcategoryName: string) => {
    const docs = categorizedDocuments[categoryId]?.[subcategoryName] || []
    
    if (!confirm(
      `Sei sicuro di voler eliminare la sottocategoria "${subcategoryName}"?\n\n` +
      `Questa azione eliminerà:\n` +
      `- ${docs.length} documenti\n` +
      `- Tutti i file associati\n\n` +
      `ATTENZIONE: Questa azione è IRREVERSIBILE!`
    )) {
      return
    }

    setDeletingSubcategory(`${categoryId}-${subcategoryName}`)

    try {
      const response = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          subcategoryName,
          action: 'delete_subcategory'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Errore durante l\'eliminazione della sottocategoria')
      }

      alert('Sottocategoria eliminata con successo!')
      window.location.reload()
    } catch (error) {
      console.error('❌ Errore:', error)
      alert(error instanceof Error ? error.message : 'Errore durante l\'eliminazione della sottocategoria')
      setDeletingSubcategory(null)
    }
  }

  return (
    <div className="p-6">
      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onAdd={handleAddCategory}
      />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestione Categorie</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Amministra le categorie e i documenti dell'archivio</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAddCategoryModalOpen(true)}
            className="flex items-center gap-2 rounded-md bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            Nuova Categoria
          </button>
          <button 
            onClick={() => setIsDocumentTypeModalOpen(true)}
            className="flex items-center gap-2 rounded-md bg-green-600 dark:bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:hover:bg-green-600"
          >
            <FileType className="h-4 w-4" />
            Tipi Documento
          </button>
          <button 
            onClick={() => setViewMode(viewMode === 'tree' ? 'grid' : 'tree')}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {viewMode === 'tree' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div>
          {/* Stats Bar */}
          <div className="mb-6 flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
            <div className="flex gap-8">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Struttura Categorie</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {totalCategories} categorie, {totalSubcategories} sottocategorie
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={expandAll}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Espandi Tutto
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <button 
                onClick={collapseAll}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Comprimi Tutto
              </button>
            </div>
          </div>

          {/* Categories Tree */}
          <div className="space-y-2">
            {Object.entries(categorizedDocuments).map(([category, subcategories]) => {
              const isExpanded = expandedCategories.has(category)
              const totalDocsInCategory = Object.values(subcategories).reduce((acc, docs) => acc + docs.length, 0)
              const totalFilesInCategory = Object.values(subcategories).reduce(
                (acc, docs) => acc + docs.reduce((sum, doc) => sum + doc.images.length, 0), 0
              )

              return (
                <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                  {/* Category Header */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 group"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                      )}
                      {isExpanded ? (
                        <FolderOpen className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <Folder className="h-5 w-5 text-yellow-500" />
                      )}
                      
                      {editingCategory === category ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingCategoryValue}
                            onChange={(e) => setEditingCategoryValue(e.target.value)}
                            className="font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const value = (e.target as HTMLInputElement).value
                                if (value.trim() && value !== getCategoryName(category)) {
                                  handleSaveCategory(category, value)
                                }
                              } else if (e.key === 'Escape') {
                                setEditingCategory(null)
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              if (editingCategoryValue.trim() && editingCategoryValue !== getCategoryName(category)) {
                                handleSaveCategory(category, editingCategoryValue)
                              } else {
                                setEditingCategory(null)
                              }
                            }}
                            className="px-3 py-1 bg-green-600 dark:bg-green-500 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 text-sm font-medium"
                            title="Salva"
                          >
                            ✓ Salva
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="px-3 py-1 bg-gray-400 dark:bg-gray-600 text-white rounded hover:bg-gray-500 dark:hover:bg-gray-500 text-sm font-medium"
                            title="Annulla"
                          >
                            ✕ Annulla
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-semibold text-gray-900 dark:text-white">{getCategoryName(category)}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingCategory(category)
                              setEditingCategoryValue(getCategoryName(category))
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 rounded border border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Modifica nome categoria"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddSubcategory(category)
                            }}
                            disabled={deletingCategory === category}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 p-1 rounded border border-green-600 dark:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Aggiungi sottocategoria"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCategory(category, getCategoryName(category))
                            }}
                            disabled={deletingCategory === category}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 rounded border border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Elimina categoria"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
                      <span className="text-sm text-gray-500 dark:text-gray-400">{Object.keys(subcategories).length} sottocategorie</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{totalDocsInCategory} documenti</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{totalFilesInCategory} files</span>
                    </div>
                  </div>

                  {/* Subcategories */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2">
                      {Object.entries(subcategories).map(([subcategory, docs]) => {
                        const subKey = `${category}-${subcategory}`
                        const isSubExpanded = expandedSubcategories.has(subKey)
                        const filesCount = docs.reduce((sum, doc) => sum + doc.images.length, 0)

                        return (
                          <div key={subKey} className="mb-2">
                            {/* Subcategory Header */}
                            <div 
                              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded group"
                              onClick={() => toggleSubcategory(subKey)}
                            >
                              <div className="flex items-center gap-3 pl-8">
                                {isSubExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                                {isSubExpanded ? (
                                  <FolderOpen className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <Folder className="h-4 w-4 text-blue-500" />
                                )}
                                
                                {editingSubcategory === subKey ? (
                                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="text"
                                      value={editingSubcategoryValue}
                                      onChange={(e) => setEditingSubcategoryValue(e.target.value)}
                                      className="font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-blue-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          const value = (e.target as HTMLInputElement).value
                                          if (value.trim() && value !== subcategory) {
                                            handleSaveSubcategory(category, subcategory, value)
                                          }
                                        } else if (e.key === 'Escape') {
                                          setEditingSubcategory(null)
                                        }
                                      }}
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => {
                                        if (editingSubcategoryValue.trim() && editingSubcategoryValue !== subcategory) {
                                          handleSaveSubcategory(category, subcategory, editingSubcategoryValue)
                                        } else {
                                          setEditingSubcategory(null)
                                        }
                                      }}
                                      className="px-2 py-1 bg-green-600 dark:bg-green-500 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 text-xs font-medium"
                                      title="Salva"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => setEditingSubcategory(null)}
                                      className="px-2 py-1 bg-gray-400 dark:bg-gray-600 text-white rounded hover:bg-gray-500 dark:hover:bg-gray-500 text-xs font-medium"
                                      title="Annulla"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      {subcategory.charAt(0).toUpperCase() + subcategory.slice(1)}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setEditingSubcategory(subKey)
                                        setEditingSubcategoryValue(subcategory)
                                      }}
                                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 rounded border border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Modifica sottocategoria"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteSubcategory(category, subcategory)
                                      }}
                                      disabled={deletingSubcategory === subKey}
                                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 rounded border border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Elimina sottocategoria"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </>
                                )}
                                
                                {docs.length === 0 && !editingSubcategory && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500 italic">(vuota)</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{docs.length} doc</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">{filesCount} files</span>
                              </div>
                            </div>

                            {/* Documents List */}
                            {isSubExpanded && docs.length > 0 && (
                              <div className="ml-16 mt-2 space-y-1">
                                {docs.map(doc => (
                                  <div 
                                    key={doc.id}
                                    className="flex items-center justify-between p-2 hover:bg-white dark:hover:bg-gray-700 rounded group"
                                  >
                                    <div className="flex items-center gap-3">
                                      <File className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                      <span className="text-sm text-gray-700 dark:text-gray-300">{doc.title}</span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">({doc.identifier})</span>
                                      {!doc.published && (
                                        <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-2 py-0.5 rounded">Bozza</span>
                                      )}
                                      <span className="text-xs text-gray-500 dark:text-gray-400">{doc.images.length} files</span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Link 
                                        href={`/viewer/${doc.id}`}
                                        className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                        title="Visualizza"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Link>
                                      <button 
                                        onClick={() => handleDownload(doc)}
                                        disabled={downloadingIds.has(doc.id)}
                                        className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Download"
                                      >
                                        <Download className="h-4 w-4" />
                                      </button>
                                      <button 
                                        onClick={() => handleDelete(doc.id, doc.title)}
                                        disabled={deletingIds.has(doc.id)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Elimina"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer Stats */}
          <div className="mt-6 flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Folder className="h-4 w-4" />
              <span>{totalCategories} Categorie</span>
            </div>
            <div className="flex items-center gap-1">
              <Folder className="h-4 w-4" />
              <span>{totalSubcategories} Sottocategorie</span>
            </div>
            <span>Espanse: 0/{totalCategories + totalSubcategories}</span>
          </div>
        </div>

      {/* Document Type Manager Modal */}
      <DocumentTypeManagerModal
        isOpen={isDocumentTypeModalOpen}
        onClose={() => setIsDocumentTypeModalOpen(false)}
      />
    </div>
  )
}
