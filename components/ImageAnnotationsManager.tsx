"use client"

import { useState } from "react"
import { Plus, Trash2, FileImage } from "lucide-react"

interface Annotation {
  label: string
  value: string
  target?: string
}

interface ImageAnnotationsManagerProps {
  files: File[]
  annotations: { [key: number]: Annotation[] }
  onChange: (annotations: { [key: number]: Annotation[] }) => void
}

export default function ImageAnnotationsManager({ 
  files, 
  annotations, 
  onChange 
}: ImageAnnotationsManagerProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)

  const addAnnotation = (imageIndex: number) => {
    const newAnnotations = { ...annotations }
    if (!newAnnotations[imageIndex]) {
      newAnnotations[imageIndex] = []
    }
    newAnnotations[imageIndex].push({ label: "", value: "" })
    onChange(newAnnotations)
  }

  const updateAnnotation = (imageIndex: number, annIndex: number, field: 'label' | 'value', newValue: string) => {
    const newAnnotations = { ...annotations }
    if (!newAnnotations[imageIndex]) {
      newAnnotations[imageIndex] = []
    }
    newAnnotations[imageIndex][annIndex] = {
      ...newAnnotations[imageIndex][annIndex],
      [field]: newValue
    }
    onChange(newAnnotations)
  }

  const deleteAnnotation = (imageIndex: number, annIndex: number) => {
    const newAnnotations = { ...annotations }
    if (newAnnotations[imageIndex]) {
      newAnnotations[imageIndex].splice(annIndex, 1)
      onChange(newAnnotations)
    }
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Carica prima le immagini per aggiungere annotazioni
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Metadati per Pagina
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Aggiungi campi informativi specifici per ogni pagina (come ID, Segnatura, Titolo, etc.). 
          Questi appariranno nel pannello "Informazioni sull'oggetto" del visualizzatore.
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
            <span className="font-medium">Pagina {index + 1}</span>
            {annotations[index] && annotations[index].length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                {annotations[index].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Annotazioni della pagina selezionata */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Metadati Pagina {selectedImageIndex + 1}
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              ({files[selectedImageIndex]?.name})
            </span>
          </h4>
          <button
            onClick={() => addAnnotation(selectedImageIndex)}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Aggiungi Campo
          </button>
        </div>

        {/* Lista annotazioni */}
        <div className="space-y-3">
          {(!annotations[selectedImageIndex] || annotations[selectedImageIndex].length === 0) ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Nessun campo informativo per questa pagina. Clicca "Aggiungi Campo" per iniziare.
            </div>
          ) : (
            annotations[selectedImageIndex].map((annotation, annIndex) => (
              <div
                key={annIndex}
                className="flex gap-2 items-start bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Etichetta Campo {annIndex + 1}
                    </label>
                    <input
                      type="text"
                      value={annotation.label}
                      onChange={(e) => updateAnnotation(selectedImageIndex, annIndex, 'label', e.target.value)}
                      placeholder="es: ID fondo di appartenenza, Segnatura, Titolo, etc."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Valore Campo {annIndex + 1}
                    </label>
                    <textarea
                      value={annotation.value}
                      onChange={(e) => updateAnnotation(selectedImageIndex, annIndex, 'value', e.target.value)}
                      placeholder="Inserisci il valore del campo..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                      rows={2}
                    />
                  </div>
                </div>
                <button
                  onClick={() => deleteAnnotation(selectedImageIndex, annIndex)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Elimina campo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Riepilogo */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Totale campi:</strong>{' '}
          {Object.values(annotations).reduce((sum, anns) => sum + anns.length, 0)} campi informativi su {files.length} pagine
        </p>
      </div>
    </div>
  )
}
