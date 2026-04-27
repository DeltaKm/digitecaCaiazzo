"use client";

import { useState } from "react";
import { Edit, Trash2, Eye, Globe, EyeOff } from "lucide-react";
import Link from "next/link";
import EditDocumentModal from "./EditDocumentModal";

interface DocumentActionsProps {
  document: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    subcategory: string;
    type: string;
    author: string;
    attribution: string;
    license: string;
    ccType?: string;
    location: string;
    collocationLocation: string;
    period: string | null;
    century: string;
    materials: string;
    dimensions: string;
    conditions: string;
    provenance: string;
    identifier: string;
    published: boolean;
  };
  onDocumentDeleted?: () => void;
  onDocumentUpdated?: () => void;
}

export default function DocumentActions({ 
  document, 
  onDocumentDeleted, 
  onDocumentUpdated 
}: DocumentActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDelete = async () => {
    console.log("🗑️ Inizio eliminazione documento:", document.id);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "DELETE",
      });

      console.log("📡 Risposta DELETE:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Errore risposta DELETE:", errorData);
        throw new Error(errorData.error || "Errore durante l'eliminazione");
      }

      const result = await response.json();
      console.log("✅ Documento eliminato:", result);

      setShowDeleteModal(false);
      onDocumentDeleted?.();
      // Ricarica la pagina per aggiornare la lista
      console.log("🔄 Ricaricando pagina...");
      window.location.reload();
    } catch (error) {
      console.error("❌ Errore eliminazione:", error);
      alert("Errore durante l'eliminazione del documento: " + (error instanceof Error ? error.message : "Errore sconosciuto"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async () => {
    console.log("🔄 Toggle pubblicazione documento:", document.id, "da", document.published, "a", !document.published);
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          published: !document.published
        })
      });

      console.log("📡 Risposta PATCH:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Errore risposta PATCH:", errorData);
        throw new Error(errorData.error || "Errore durante l'aggiornamento");
      }

      const result = await response.json();
      console.log("✅ Documento aggiornato:", result.published);

      onDocumentUpdated?.();
      // Ricarica la pagina per aggiornare lo stato
      console.log("🔄 Ricaricando pagina...");
      window.location.reload();
    } catch (error) {
      console.error("❌ Errore aggiornamento:", error);
      alert("Errore durante l'aggiornamento del documento: " + (error instanceof Error ? error.message : "Errore sconosciuto"));
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Visualizza */}
        <Link
          href={`/viewer/${document.id}`}
          className="text-blue-600 hover:text-blue-800 p-1 rounded"
          title="Visualizza documento"
        >
          <Eye className="h-4 w-4" />
        </Link>

        {/* Toggle Pubblicazione */}
        <button
          onClick={handleTogglePublish}
          className={`p-1 rounded text-sm font-medium ${
            document.published 
              ? 'text-yellow-600 hover:text-yellow-800' 
              : 'text-green-600 hover:text-green-800'
          }`}
          title={document.published ? "Nascondi" : "Pubblica"}
        >
          {document.published ? "📝" : "✅"}
        </button>

        {/* Modifica */}
        <button
          onClick={() => setShowEditModal(true)}
          className="text-orange-600 hover:text-orange-800 p-1 rounded"
          title="Modifica documento"
        >
          <Edit className="h-4 w-4" />
        </button>

        {/* Elimina */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="text-red-600 hover:text-red-800 p-1 rounded"
          title="Elimina documento"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Modal Conferma Eliminazione */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Conferma eliminazione
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Sei sicuro di voler eliminare il documento "<strong>{document.title}</strong>"? 
              Questa azione non può essere annullata.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800"
                disabled={isDeleting}
              >
                Annulla
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? "Eliminando..." : "Elimina"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifica */}
      <EditDocumentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        document={document}
        onDocumentUpdated={onDocumentUpdated}
      />
    </>
  );
}
