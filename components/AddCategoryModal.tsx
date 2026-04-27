"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface AddCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (categoryId: string, categoryName: string, subcategories: string[]) => void
}

export default function AddCategoryModal({ isOpen, onClose, onAdd }: AddCategoryModalProps) {
  const [categoryId, setCategoryId] = useState("")
  const [categoryName, setCategoryName] = useState("")
  const [subcategories, setSubcategories] = useState<string[]>([""])
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const addSubcategoryField = () => {
    setSubcategories([...subcategories, ""])
  }

  const updateSubcategory = (index: number, value: string) => {
    const newSubcategories = [...subcategories]
    newSubcategories[index] = value
    setSubcategories(newSubcategories)
  }

  const removeSubcategory = (index: number) => {
    if (subcategories.length > 1) {
      setSubcategories(subcategories.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Filtra sottocategorie vuote
    const validSubcategories = subcategories.filter(sub => sub.trim() !== "")

    if (!categoryId.trim() || !categoryName.trim() || validSubcategories.length === 0) {
      alert("Compila tutti i campi obbligatori")
      setIsSubmitting(false)
      return
    }

    try {
      onAdd(categoryId.trim(), categoryName.trim(), validSubcategories)
      
      // Reset form
      setCategoryId("")
      setCategoryName("")
      setSubcategories([""])
      onClose()
    } catch (error) {
      console.error("Errore:", error)
      alert("Errore durante l'aggiunta della categoria")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white dark:bg-gray-800 shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Aggiungi Nuova Categoria</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ID Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID Categoria *
            </label>
            <input
              type="text"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              placeholder="es. archivi, biblioteche, musei"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              Usa solo lettere minuscole senza spazi (es: "archivi-storici")
            </p>
          </div>

          {/* Nome Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Categoria *
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="es. Archivi, Biblioteche, Musei"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Sottocategorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sottocategorie *
            </label>
            <div className="space-y-2">
              {subcategories.map((subcategory, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={subcategory}
                    onChange={(e) => updateSubcategory(index, e.target.value)}
                    placeholder={`Sottocategoria ${index + 1}`}
                    className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  {subcategories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubcategory(index)}
                      className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      disabled={isSubmitting}
                    >
                      Rimuovi
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addSubcategoryField}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
              disabled={isSubmitting}
            >
              + Aggiungi Sottocategoria
            </button>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Aggiunta in corso..." : "Aggiungi Categoria"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

