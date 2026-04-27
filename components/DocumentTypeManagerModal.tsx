"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, GripVertical } from "lucide-react";

interface DocumentTypeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DocumentType {
  id: string;
  typeId: string;
  name: string;
  order: number;
}

export default function DocumentTypeManagerModal({ isOpen, onClose }: DocumentTypeManagerModalProps) {
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTypeId, setNewTypeId] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Carica i tipi dall'API
  const loadDocumentTypes = async () => {
    console.log('🔄 Caricamento tipi documento...');
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/document-types', {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore caricamento tipi');
      }
      
      const data = await response.json();
      console.log('✅ Tipi documento caricati:', data);
      setTypes(data);
    } catch (error) {
      console.error('❌ Errore caricamento tipi:', error);
      setError('Errore durante il caricamento dei tipi di documento');
    } finally {
      setLoading(false);
    }
  };

  // Carica tipi quando il modal si apre
  useEffect(() => {
    if (isOpen) {
      console.log('📂 Modal aperto, carico tipi...');
      loadDocumentTypes();
    }
  }, [isOpen]);

  // Reset form quando il modal si chiude
  useEffect(() => {
    if (!isOpen) {
      setNewTypeId("");
      setNewTypeName("");
      setShowAddForm(false);
      setError(null);
    }
  }, [isOpen]);

  const handleAddType = async () => {
    console.log('➕ Tentativo aggiunta tipo:', { typeId: newTypeId, name: newTypeName });
    
    if (!newTypeId.trim() || !newTypeName.trim()) {
      setError('TypeId e Nome sono obbligatori');
      return;
    }
    
    try {
      const response = await fetch('/api/document-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeId: newTypeId.trim(),
          name: newTypeName.trim(),
          order: types.length
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Errore risposta API:', errorData);
        throw new Error(errorData.error || 'Errore creazione tipo');
      }
      
      const result = await response.json();
      console.log('✅ Tipo creato con successo:', result);
      
      await loadDocumentTypes();
      setNewTypeId("");
      setNewTypeName("");
      setShowAddForm(false);
      setError(null);
    } catch (error: any) {
      console.error('❌ Errore creazione tipo:', error);
      setError(error.message || 'Errore durante la creazione del tipo');
    }
  };

  const handleDeleteType = async (id: string, typeId: string, name: string) => {
    console.log('🗑️ Tentativo eliminazione tipo:', { id, typeId, name });
    
    if (!confirm(`Sei sicuro di voler eliminare il tipo "${name}"?`)) {
      console.log('❌ Eliminazione annullata dall\'utente');
      return;
    }
    
    try {
      console.log('📤 Invio richiesta DELETE con id:', id);
      const response = await fetch('/api/document-types', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Errore risposta DELETE:', errorData);
        throw new Error(errorData.error || 'Errore eliminazione tipo');
      }
      
      const result = await response.json();
      console.log('✅ Tipo eliminato con successo:', result);
      
      await loadDocumentTypes();
      setError(null);
    } catch (error: any) {
      console.error('❌ Errore eliminazione tipo:', error);
      setError(error.message || 'Errore durante l\'eliminazione del tipo');
    }
  };

  const handleUpdateOrder = async (id: string, newOrder: number) => {
    console.log('🔄 Aggiornamento ordine:', { id, newOrder });
    
    try {
      const response = await fetch('/api/document-types', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, order: newOrder })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Errore aggiornamento ordine:', errorData);
        throw new Error(errorData.error || 'Errore aggiornamento ordine');
      }
      
      const result = await response.json();
      console.log('✅ Ordine aggiornato:', result);
      
      await loadDocumentTypes();
    } catch (error: any) {
      console.error('❌ Errore aggiornamento ordine:', error);
      setError(error.message || 'Errore durante l\'aggiornamento dell\'ordine');
    }
  };

  const moveType = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === types.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const type = types[index];
    
    handleUpdateOrder(type.id, newIndex);
  };

  if (!isOpen) return null;

  console.log("📋 Rendering DocumentTypeManagerModal, isOpen:", isOpen);

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white dark:bg-gray-800 shadow-xl pointer-events-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestione Tipi Documento</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 rounded">
                {error}
              </div>
            )}

            {/* Pulsante Aggiungi Tipo */}
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mb-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5" />
                Nuovo Tipo Documento
              </button>
            )}

            {/* Form Aggiunta Tipo */}
            {showAddForm && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Nuovo Tipo</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type ID (es: documento-testuale)
                    </label>
                    <input
                      type="text"
                      value={newTypeId}
                      onChange={(e) => setNewTypeId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="documento-testuale"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome visualizzato
                    </label>
                    <input
                      type="text"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Documento Testuale"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddType}
                      className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      Aggiungi
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewTypeId("");
                        setNewTypeName("");
                        setError(null);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista Tipi */}
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Caricamento...</p>
              </div>
            ) : types.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Nessun tipo documento presente
              </div>
            ) : (
              <div className="space-y-2">
                {types.map((type, index) => (
                  <div
                    key={type.id}
                    className="flex items-center gap-3 p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveType(index, 'up')}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <GripVertical className="h-4 w-4 rotate-180" />
                      </button>
                      <button
                        onClick={() => moveType(index, 'down')}
                        disabled={index === types.length - 1}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{type.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">ID: {type.typeId}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteType(type.id, type.typeId, type.name)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Elimina tipo"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
