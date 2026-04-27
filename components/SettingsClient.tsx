"use client"

import { useState } from "react"
import { FileType, Tags } from "lucide-react"
import CategoryManagerModal from "./CategoryManagerModal"
import DocumentTypeManagerModal from "./DocumentTypeManagerModal"

export default function SettingsClient() {
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showTypeModal, setShowTypeModal] = useState(false)

  return (
    <>
      {/* Gestione Categorie e Tipi */}
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Tags className="h-5 w-5 text-orange-600" />
          Gestione Contenuti
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Categorie</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gestisci le categorie e sottocategorie dei documenti
              </p>
            </div>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="rounded-md bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              Gestisci
            </button>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Tipi di Documento</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gestisci i tipi di documento disponibili (immagini, video, audio, ecc.)
              </p>
            </div>
            <button
              onClick={() => setShowTypeModal(true)}
              className="rounded-md bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              Gestisci
            </button>
          </div>
        </div>
      </div>

      {/* Modali */}
      <CategoryManagerModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
      />
      <DocumentTypeManagerModal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
      />
    </>
  )
}
