"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import UploadModal from "./UploadModal"

interface DocumentsHeaderProps {
  onDocumentCreated?: () => void
}

export default function DocumentsHeader({ onDocumentCreated }: DocumentsHeaderProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Documenti</h1>
          <p className="text-sm text-gray-600">Amministra tutti i documenti del sistema</p>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Nuovo Documento
        </button>
      </div>

      <UploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false)
          // Ricarica la pagina per vedere il nuovo documento
          window.location.reload()
        }}
      />
    </>
  )
}
