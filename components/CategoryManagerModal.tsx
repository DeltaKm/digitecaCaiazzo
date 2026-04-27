"use client";

import { useState, useEffect } from "react";
import { X, Plus, Edit2, Trash2 } from "lucide-react";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Category {
  id: string;
  name: string;
  subcategories: string[];
}

export default function CategoryManagerModal({ isOpen, onClose }: CategoryManagerModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<string | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState("");
  const [editingSubcategoryValue, setEditingSubcategoryValue] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSubcategory, setShowAddSubcategory] = useState<string | null>(null);

  // Carica le categorie dall'API
  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories', {
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('Errore caricamento categorie');
      const data = await response.json();
      console.log('📥 Categorie caricate:', data);
      setCategories(data);
    } catch (error) {
      console.error('Errore caricamento categorie:', error);
      alert('Errore durante il caricamento delle categorie');
    } finally {
      setLoading(false);
    }
  };

  // Carica categorie quando il modal si apre
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  // Reset form quando il modal si chiude
  useEffect(() => {
    if (!isOpen) {
      setEditingCategory(null);
      setEditingSubcategory(null);
      setNewCategoryName("");
      setNewSubcategoryName("");
      setShowAddCategory(false);
      setShowAddSubcategory(null);
    }
  }, [isOpen]);

  const handleSaveCategory = async (categoryId: string, newName: string) => {
    if (!newName.trim()) return;
    
    try {
      const response = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          newName,
          action: 'rename'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore aggiornamento categoria');
      }
      
      const result = await response.json();
      console.log('✅ Risposta dal server:', result);
      
      // Ricarica le categorie
      await loadCategories();
      setEditingCategory(null);
    } catch (error) {
      console.error('❌ Errore:', error);
      alert('Errore durante il salvataggio della categoria');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    const categoryId = newCategoryName.toLowerCase().replace(/\s+/g, '-');
    
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          name: newCategoryName
        })
      });

      if (!response.ok) throw new Error('Errore creazione categoria');
      
      await loadCategories(); // Ricarica le categorie
      setNewCategoryName("");
      setShowAddCategory(false);
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante la creazione della categoria');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa categoria? Tutti i file associati saranno eliminati.")) {
      return;
    }
    
    try {
      const response = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          action: 'delete'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore eliminazione categoria');
      }
      
      await loadCategories();
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante l\'eliminazione della categoria');
    }
  };

  const handleSaveSubcategory = async (categoryId: string, oldName: string, newName: string) => {
    if (!newName.trim()) return;
    
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
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore aggiornamento sottocategoria');
      }
      
      await loadCategories();
      setEditingSubcategory(null);
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante il salvataggio della sottocategoria');
    }
  };

  const handleAddSubcategory = async (categoryId: string) => {
    if (!newSubcategoryName.trim()) return;
    
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          subcategory: newSubcategoryName
        })
      });

      if (!response.ok) throw new Error('Errore aggiunta sottocategoria');
      
      await loadCategories(); // Ricarica le categorie
      setNewSubcategoryName("");
      setShowAddSubcategory(null);
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante l\'aggiunta della sottocategoria');
    }
  };

  const handleDeleteSubcategory = async (categoryId: string, subcategoryName: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa sottocategoria? Tutti i file associati saranno eliminati.")) {
      return;
    }
    
    try {
      const response = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          subcategoryName,
          action: 'delete_subcategory'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore eliminazione sottocategoria');
      }
      
      await loadCategories();
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante l\'eliminazione della sottocategoria');
    }
  };

  if (!isOpen) return null;

  console.log("🏷️ Rendering CategoryManagerModal, isOpen:", isOpen);

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white dark:bg-gray-800 shadow-xl pointer-events-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestione Categorie e Sottocategorie</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            {/* Stato di caricamento */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Caricamento categorie...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Aggiungi nuova categoria */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Categorie</h3>
                    <button
                      onClick={() => setShowAddCategory(true)}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded text-sm hover:bg-blue-700 dark:hover:bg-blue-600"
                    >
                      <Plus className="h-4 w-4" />
                      Aggiungi Categoria
                    </button>
                  </div>
              
              {showAddCategory && (
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nome nuova categoria"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <button
                    onClick={handleAddCategory}
                    className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Salva
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategoryName("");
                    }}
                    className="px-3 py-2 bg-gray-400 dark:bg-gray-600 text-white rounded text-sm hover:bg-gray-500"
                  >
                    Annulla
                  </button>
                </div>
              )}
            </div>

            {/* Lista categorie */}
            <div className="space-y-6">
              {categories.map((category) => (
                <div key={category.id} className="border border-gray-200 rounded-lg">
                  {/* Header categoria */}
                  <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {editingCategory === category.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingCategoryValue}
                              onChange={(e) => setEditingCategoryValue(e.target.value)}
                              className="font-semibold text-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-1"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const value = (e.target as HTMLInputElement).value;
                                  if (value.trim() && value !== category.name) {
                                    handleSaveCategory(category.id, value);
                                  }
                                } else if (e.key === 'Escape') {
                                  setEditingCategory(null);
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                if (editingCategoryValue.trim() && editingCategoryValue !== category.name) {
                                  handleSaveCategory(category.id, editingCategoryValue);
                                } else {
                                  setEditingCategory(null);
                                }
                              }}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                              title="Salva modifiche"
                            >
                              ✓ Salva
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm font-medium"
                              title="Annulla modifica"
                            >
                              ✕ Annulla
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{category.name}</h3>
                            <button
                              onClick={() => {
                                setEditingCategory(category.id);
                                setEditingCategoryValue(category.name);
                              }}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md border border-blue-600 hover:bg-blue-50"
                              title="Modifica nome categoria"
                            >
                              <Edit2 className="h-4 w-4" />
                              <span className="text-sm font-medium">Modifica</span>
                            </button>
                          </div>
                        )}
                        <span className="text-sm text-gray-500">({category.subcategories.length} sottocategorie)</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Elimina categoria"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowAddSubcategory(category.id)}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          <Plus className="h-3 w-3" />
                          Aggiungi
                        </button>
                      </div>
                    </div>
                    
                    {/* Form aggiunta sottocategoria */}
                    {showAddSubcategory === category.id && (
                      <div className="flex items-center gap-2 mt-3">
                        <input
                          type="text"
                          value={newSubcategoryName}
                          onChange={(e) => setNewSubcategoryName(e.target.value)}
                          placeholder="Nome nuova sottocategoria"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddSubcategory(category.id)}
                        />
                        <button
                          onClick={() => handleAddSubcategory(category.id)}
                          className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Salva
                        </button>
                        <button
                          onClick={() => {
                            setShowAddSubcategory(null);
                            setNewSubcategoryName("");
                          }}
                          className="px-3 py-2 bg-gray-400 dark:bg-gray-600 text-white rounded text-sm hover:bg-gray-500"
                        >
                          Annulla
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Lista sottocategorie */}
                  <div className="p-4">
                    {category.subcategories.length === 0 ? (
                      <p className="text-gray-500 text-sm italic">Nessuna sottocategoria</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {category.subcategories.map((subcategory) => (
                          <div
                            key={subcategory}
                            className="flex items-center justify-between bg-white border border-gray-200 rounded p-3"
                          >
                            {editingSubcategory === `${category.id}-${subcategory}` ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editingSubcategoryValue}
                                  onChange={(e) => setEditingSubcategoryValue(e.target.value)}
                                  className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      const value = (e.target as HTMLInputElement).value;
                                      if (value.trim() && value !== subcategory) {
                                        handleSaveSubcategory(category.id, subcategory, value);
                                      }
                                    } else if (e.key === 'Escape') {
                                      setEditingSubcategory(null);
                                    }
                                  }}
                                  autoFocus
                                />
                                <button
                                  onClick={() => {
                                    if (editingSubcategoryValue.trim() && editingSubcategoryValue !== subcategory) {
                                      handleSaveSubcategory(category.id, subcategory, editingSubcategoryValue);
                                    } else {
                                      setEditingSubcategory(null);
                                    }
                                  }}
                                  className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                                  title="Salva"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingSubcategory(null)}
                                  className="px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-xs font-medium"
                                  title="Annulla"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{subcategory}</span>
                                  <button
                                    onClick={() => {
                                      setEditingSubcategory(`${category.id}-${subcategory}`);
                                      setEditingSubcategoryValue(subcategory);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 p-1 rounded border border-blue-600 hover:bg-blue-50"
                                    title="Modifica sottocategoria"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                </div>
                                
                                <div className="flex items-center gap-1 ml-2">
                                  <button
                                    onClick={() => handleDeleteSubcategory(category.id, subcategory)}
                                    className="text-red-600 hover:text-red-800 p-1"
                                    title="Elimina sottocategoria"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
              </>
            )}
          </div>

          <div className="sticky bottom-0 border-t bg-white px-6 py-4">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
