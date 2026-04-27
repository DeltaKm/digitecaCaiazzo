"use client"

import { useState } from "react"
import { FileImage, Edit2 } from "lucide-react"

interface PageLabelsManagerProps {
  files: File[]
  labels: { [key: number]: string }
  onChange: (labels: { [key: number]: string }) => void
}

export default function PageLabelsManager({ 
  files, 
  labels, 
  onChange 
}: PageLabelsManagerProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)

  const updateLabel = (imageIndex: number, newLabel: string) => {
    const newLabels = { ...labels }
    newLabels[imageIndex] = newLabel
    onChange(newLabels)
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Carica prima i file per gestire i nomi delle pagine
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Nomi delle Pagine
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Personalizza il nome di ogni pagina (es: "Copertina", "Pagina 1r", "Frontespizio", etc.). 
          Se lasci vuoto, verrà usato il nome predefinito "Pagina X".
        </p>
      </div>
      
      {/* Tab delle immagini */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {files.map((file, index) => (
          <button
            key={index}
            onClick={() => setSelectedImageIndex(index)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors whitespace-nowrap ${
              selectedImageIndex === index
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FileImage className="h-4 w-4" />
            <span className="font-medium">
              {labels[index] || `Pagina ${index + 1}`}
            </span>
          </button>
        ))}
      </div>

      {/* Editor label pagina selezionata */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <FileImage className="h-4 w-4" />
            <span>{files[selectedImageIndex]?.name}</span>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Edit2 className="inline h-4 w-4 mr-1" />
              Nome Pagina {selectedImageIndex + 1}
            </label>
            <input
              type="text"
              value={labels[selectedImageIndex] || ""}
              onChange={(e) => updateLabel(selectedImageIndex, e.target.value)}
              placeholder={`Pagina ${selectedImageIndex + 1} (predefinito)`}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Esempi: "Copertina", "Pagina 1r", "Pagina 1v", "Frontespizio", "Retro", etc.
            </p>
          </div>
        </div>
      </div>

      {/* Riepilogo */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Totale pagine:</strong>{' '}
          {files.length} pagine - {Object.values(labels).filter(l => l).length} con nome personalizzato
        </p>
      </div>
    </div>
  )
}
