"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Trash2, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import EditDocumentModal from "./EditDocumentModal"

interface Image {
  id: string
  url: string
  width: number
  height: number
  format: string
  order: number
  transcription: string | null
  keywords: string | null
  notes: string | null
  createdAt: string
}

interface Document {
  id: string
  title: string
  description?: string | null
  identifier: string
  category: string
  subcategory: string
  type?: string
  author?: string
  attribution?: string
  license?: string
  ccType?: string
  location?: string
  collocationLocation?: string
  period?: string | null
  century?: string
  materials?: string
  dimensions?: string
  conditions?: string
  provenance?: string
  published: boolean
  createdAt: string
  updatedAt: string
  images: Image[]
  user: {
    name: string | null
    email: string
  }
}

interface AdminDocumentsTableProps {
  documents: Document[]
}

export default function AdminDocumentsTable({ documents }: AdminDocumentsTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.subcategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!confirm(`Sei sicuro di voler eliminare il documento "${docTitle}"?\n\nQuesta azione è irreversibile e eliminerà anche tutti i file associati.`)) {
      return
    }

    setDeletingId(docId)

    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Errore durante l'eliminazione")
      }

      // Ricarica la pagina per aggiornare la lista
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Errore durante l'eliminazione del documento")
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra di ricerca */}
      <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per titolo, identificativo, categoria, autore..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-gray-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? 'i' : ''} trovato{filteredDocuments.length !== 1 ? 'i' : ''}
          </p>
        )}
      </div>

      {/* Tabella documenti */}
      <div className="rounded-lg bg-white dark:bg-gray-800 shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Titolo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Autore
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Files
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Data
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 dark:bg-gray-700">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{doc.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{doc.identifier}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">{doc.category}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{doc.subcategory}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">{doc.user.name || doc.user.email}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {doc.images.length} file{doc.images.length !== 1 ? 's' : ''}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {doc.published ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                        Pubblicato
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800">
                        Bozza
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(doc.createdAt).toLocaleDateString('it-IT')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/viewer/${doc.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Visualizza
                      </Link>
                      <button
                        onClick={() => setEditingDocument(doc)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Modifica documento"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id, doc.title)}
                        disabled={deletingId === doc.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Elimina documento"
                      >
                        {deletingId === doc.id ? (
                          <span className="text-xs">Eliminazione...</span>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredDocuments.length === 0 && (
        <div className="rounded-lg bg-white p-12 text-center shadow">
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? "Nessun documento trovato con questi criteri" : "Nessun documento presente nel sistema"}
          </p>
        </div>
      )}

      {/* Modal di modifica */}
      {editingDocument && (
        <EditDocumentModal
          isOpen={true}
          onClose={() => setEditingDocument(null)}
          document={{
            id: editingDocument.id,
            title: editingDocument.title,
            description: editingDocument.description || null,
            category: editingDocument.category,
            subcategory: editingDocument.subcategory,
            type: editingDocument.type || "documento-testuale",
            author: editingDocument.author || "",
            attribution: editingDocument.attribution || "",
            license: editingDocument.license || "tutti-i-diritti-riservati",
            ccType: editingDocument.ccType || "",
            location: editingDocument.location || "",
            collocationLocation: editingDocument.collocationLocation || "",
            period: editingDocument.period || null,
            century: editingDocument.century || "",
            materials: editingDocument.materials || "",
            dimensions: editingDocument.dimensions || "",
            conditions: editingDocument.conditions || "",
            provenance: editingDocument.provenance || "",
            identifier: editingDocument.identifier,
            published: editingDocument.published
          }}
          onDocumentUpdated={() => {
            setEditingDocument(null);
            router.refresh();
          }}
        />
      )}
    </div>
  )
}

