"use client";

import DocumentActions from "./DocumentActions";
import DocumentsHeader from "./DocumentsHeader";

interface AdminDocumentsClientProps {
  documents: Array<{
    id: string;
    title: string;
    description: string | null;
    category: string;
    subcategory: string;
    type: string;
    period: string | null;
    identifier: string;
    // Nuovi campi metadati
    author?: string;
    attribution?: string;
    license?: string;
    ccType?: string;
    location?: string;
    collocationLocation?: string;
    century?: string;
    materials?: string;
    dimensions?: string;
    conditions?: string;
    provenance?: string;
    published: boolean;
    createdAt: string;
    user: {
      name: string | null;
      email: string | null;
    };
    images: Array<{
      id: string;
      url: string;
      width: number;
      height: number;
      format: string;
      order: number;
      createdAt: string;
    }>;
  }>;
}

export default function AdminDocumentsClient({ documents }: AdminDocumentsClientProps) {
  console.log("📊 AdminDocumentsClient rendering con", documents.length, "documenti");

  return (
    <>
      {/* Header con pulsante nuovo documento */}
      <DocumentsHeader />

      {/* Tabella documenti */}
      <div className="rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Titolo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Autore
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Files
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Data
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium text-gray-900">{doc.title}</div>
                        <div className="text-sm text-gray-500">{doc.identifier}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">{doc.category}</div>
                    <div className="text-sm text-gray-500">{doc.subcategory}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">{doc.user.name || doc.user.email || "Sconosciuto"}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
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
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString('it-IT')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <DocumentActions
                      document={{
                        ...doc,
                        author: doc.author || "",
                        attribution: doc.attribution || "",
                        license: doc.license || "tutti-i-diritti-riservati",
                        ccType: doc.ccType || "",
                        location: doc.location || "",
                        collocationLocation: doc.collocationLocation || "",
                        century: doc.century || "",
                        materials: doc.materials || "",
                        dimensions: doc.dimensions || "",
                        conditions: doc.conditions || "",
                        provenance: doc.provenance || ""
                      }}
                      onDocumentDeleted={() => {
                        console.log("Documento eliminato, ricarico pagina...");
                        window.location.reload();
                      }}
                      onDocumentUpdated={() => {
                        console.log("Documento aggiornato, ricarico pagina...");
                        window.location.reload();
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Messaggio se nessun documento */}
      {documents.length === 0 && (
        <div className="rounded-lg bg-white p-12 text-center shadow">
          <p className="text-gray-500">Nessun documento presente nel sistema</p>
        </div>
      )}
    </>
  );
}