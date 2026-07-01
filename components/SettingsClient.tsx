"use client"

import { useState } from "react"
import { FileType, Tags, Wrench } from "lucide-react"
import CategoryManagerModal from "./CategoryManagerModal"
import DocumentTypeManagerModal from "./DocumentTypeManagerModal"

interface SettingsClientProps {
  initialMaintenanceMode?: boolean
}

export default function SettingsClient({ initialMaintenanceMode = false }: SettingsClientProps) {
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(initialMaintenanceMode)
  const [maintenanceLoading, setMaintenanceLoading] = useState(false)

  const toggleMaintenance = async () => {
    setMaintenanceLoading(true)
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !maintenanceMode }),
      })
      if (res.ok) {
        setMaintenanceMode((prev) => !prev)
      }
    } finally {
      setMaintenanceLoading(false)
    }
  }

  return (
    <>
      {/* Modalità Manutenzione */}
      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Wrench className="h-5 w-5 text-yellow-600" />
          Modalità Manutenzione
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {maintenanceMode ? "Attiva" : "Disattiva"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {maintenanceMode
                ? "Il sito mostra la pagina di manutenzione con password di sblocco. Gli admin accedono sempre."
                : "Il sito è accessibile a tutti normalmente."}
            </p>
          </div>
          <button
            onClick={toggleMaintenance}
            disabled={maintenanceLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
              maintenanceMode ? "bg-yellow-500" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                maintenanceMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

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
