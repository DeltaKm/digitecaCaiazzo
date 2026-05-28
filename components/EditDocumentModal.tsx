"use client";

import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { HISTORICAL_PERIODS } from "@/lib/periods";

interface Category {
  categoryId: string;
  name: string;
  subcategories: string[];
}

interface DocumentType {
  id: string;
  typeId: string;
  name: string;
  order: number;
}

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  onDocumentUpdated?: () => void;
}

export default function EditDocumentModal({ 
  isOpen, 
  onClose, 
  document, 
  onDocumentUpdated 
}: EditDocumentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    type: "documento-testuale",
    status: "pubblicato",
    identifier: "",
    author: "",
    attribution: "",
    license: "tutti-i-diritti-riservati",
    ccType: "",
    location: "",
    collocationLocation: "",
    period: "",
    date: "",
    materials: "",
    dimensions: "",
    conditions: "",
    provenance: "",
    transcription: "",
    keywords: "",
    notes: "",
  });

  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  // Carica le categorie dall'API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Errore caricamento categorie');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Errore caricamento categorie:', error);
      }
    };
    
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  // Carica i tipi di documento dall'API
  useEffect(() => {
    const loadDocumentTypes = async () => {
      try {
        const response = await fetch('/api/document-types');
        if (!response.ok) throw new Error('Errore caricamento tipi');
        const data = await response.json();
        setDocumentTypes(data);
      } catch (error) {
        console.error('Errore caricamento tipi:', error);
      }
    };
    
    if (isOpen) {
      loadDocumentTypes();
    }
  }, [isOpen]);

  // Inizializza i dati del form con i valori del documento
  useEffect(() => {
    if (isOpen && document && categories.length > 0) {
      setFormData({
        title: document.title,
        description: document.description || "",
        category: document.category,
        subcategory: document.subcategory,
        type: document.type,
        status: document.published ? "pubblicato" : "bozza",
        identifier: document.identifier || "",
        author: document.author || "",
        attribution: document.attribution || "",
        license: document.license || "tutti-i-diritti-riservati",
        ccType: document.ccType || "",
        location: document.location || "",
        collocationLocation: document.collocationLocation || "",
        period: document.period || "",
        date: document.century || "",
        materials: document.materials || "",
        dimensions: document.dimensions || "",
        conditions: document.conditions || "",
        provenance: document.provenance || "",
        transcription: "",
        keywords: "",
        notes: "",
      });

      // Imposta le sottocategorie per la categoria corrente
      if (document.category) {
        setSubcategories(getSubcategories(document.category));
      }

      setError("");
      setMissingFields([]);
    }
  }, [isOpen, document, categories]);

  const getCategoryById = (id: string) => {
    return categories.find(cat => cat.categoryId === id);
  };

  const getSubcategories = (categoryName: string): string[] => {
    const category = getCategoryById(categoryName);
    // Rimuovi duplicati usando Set
    return category?.subcategories ? Array.from(new Set(category.subcategories)) : [];
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter(keyword => keyword !== keywordToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMissingFields([]);

    // Validazione campi obbligatori
    const required = [];
    if (!formData.title.trim()) required.push('title');
    if (!formData.category) required.push('category');
    if (!formData.subcategory) required.push('subcategory');
    
    if (required.length > 0) {
      setMissingFields(required);
      setError("Compila tutti i campi obbligatori evidenziati in rosso");
      setLoading(false);
      return;
    }

    try {
      // Costruisce i dati per l'aggiornamento
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        type: formData.type,
        author: formData.author,
        attribution: formData.attribution,
        license: formData.license,
        ccType: formData.ccType,
        location: formData.location,
        collocationLocation: formData.collocationLocation,
        period: formData.period,
        century: formData.date, // Mappa date a century per il DB
        materials: formData.materials,
        dimensions: formData.dimensions,
        conditions: formData.conditions,
        provenance: formData.provenance,
        published: formData.status === "pubblicato"
      };

      // Aggiungi identifier solo se non è vuoto (per evitare problemi di uniqueness)
      if (formData.identifier?.trim()) {
        updateData.identifier = formData.identifier.trim();
      }

      console.log('📝 Dati da inviare:', updateData)

      console.log('📝 Dati da inviare:', updateData)

      const response = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore durante l'aggiornamento");
      }

      onDocumentUpdated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Modifica Documento</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Informazioni Base */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informazioni Base</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Titolo *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value })
                      setMissingFields(missingFields.filter(f => f !== 'title'))
                    }}
                    className={`w-full rounded-md border px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 ${
                      missingFields.includes('title')
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    placeholder="Inserisci il titolo del documento"
                  />
                  {missingFields.includes('title') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">Il titolo è obbligatorio</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrizione
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={3}
                    placeholder="Descrizione del documento..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categoria *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        setFormData({ ...formData, category: e.target.value, subcategory: "" });
                        setSubcategories(getSubcategories(e.target.value));
                        setMissingFields(missingFields.filter(f => f !== 'category'))
                      }}
                      className={`w-full rounded-md border px-4 py-2 text-gray-900 font-medium focus:outline-none focus:ring-1 ${
                        missingFields.includes('category')
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      }`}
                    >
                      <option value="">Seleziona categoria</option>
                      {categories.map((cat) => (
                        <option key={cat.categoryId} value={cat.categoryId}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {missingFields.includes('category') && (
                      <p className="mt-1 text-sm text-red-600">La categoria è obbligatoria</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sottocategoria *
                    </label>
                    <select
                      value={formData.subcategory}
                      onChange={(e) => {
                        setFormData({ ...formData, subcategory: e.target.value });
                        setMissingFields(missingFields.filter(f => f !== 'subcategory'))
                      }}
                      className={`w-full rounded-md border px-4 py-2 text-gray-900 font-medium focus:outline-none focus:ring-1 ${
                        missingFields.includes('subcategory')
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      }`}
                      disabled={!formData.category}
                    >
                      <option value="">Seleziona sottocategoria</option>
                      {subcategories.map((subcat, index) => (
                        <option key={`${subcat}-${index}`} value={subcat}>
                          {subcat}
                        </option>
                      ))}
                    </select>
                    {missingFields.includes('subcategory') && (
                      <p className="mt-1 text-sm text-red-600">La sottocategoria è obbligatoria</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Seleziona tipo</option>
                      {documentTypes.map((type) => (
                        <option key={type.id} value={type.typeId}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Stato pubblicazione
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="pubblicato">Pubblicato</option>
                      <option value="bozza">Bozza</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Identificativo
                    </label>
                    <input
                      type="text"
                      value={formData.identifier}
                      onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Codice identificativo (opzionale)"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Metadati Storici */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Metadati Storici</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Autore
                    </label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Nome dell'autore"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Attribuzione
                    </label>
                    <input
                      type="text"
                      value={formData.attribution}
                      onChange={(e) => setFormData({ ...formData, attribution: e.target.value })}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Attribuzione dell'opera"
                    />
                  </div>

                  {/* Sezione Copyright e Licenza */}
                  <div className="col-span-2 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Copyright e Diritti d&apos;Uso
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tipo di Licenza *
                        </label>
                        <select
                          value={formData.license}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            license: e.target.value,
                            ccType: e.target.value === 'creative-commons' ? (formData.ccType || 'cc-by') : ''
                          })}
                          className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="tutti-i-diritti-riservati">Tutti i diritti riservati</option>
                          <option value="creative-commons">Creative Commons (CC)</option>
                          <option value="dominio-pubblico">Dominio Pubblico</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formData.license === 'tutti-i-diritti-riservati' && 'L\'utente può solo visualizzare, non può riutilizzare'}
                          {formData.license === 'creative-commons' && 'Licenza aperta con alcune condizioni'}
                          {formData.license === 'dominio-pubblico' && 'Uso libero, anche commerciale'}
                        </p>
                      </div>

                      {/* Dropdown condizionale per Creative Commons */}
                      {formData.license === 'creative-commons' && (
                        <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-300 dark:border-blue-700">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tipo di Creative Commons *
                          </label>
                          <select
                            value={formData.ccType}
                            onChange={(e) => setFormData({ ...formData, ccType: e.target.value })}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="cc-by">CC BY - Attribuzione</option>
                            <option value="cc-by-sa">CC BY-SA - Attribuzione + Condividi allo stesso modo</option>
                            <option value="cc-by-nc">CC BY-NC - Attribuzione + Non commerciale</option>
                          </select>
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            {formData.ccType === 'cc-by' && (
                              <p>✅ Permette qualsiasi utilizzo, anche commerciale, purché si citi l&apos;autore</p>
                            )}
                            {formData.ccType === 'cc-by-sa' && (
                              <p>✅ Come CC BY, ma le opere derivate devono usare la stessa licenza</p>
                            )}
                            {formData.ccType === 'cc-by-nc' && (
                              <p>✅ Permette l&apos;uso con attribuzione, ma non per scopi commerciali</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Luogo origine/produzione
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Luogo di origine o creazione"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Luogo collocazione
                    </label>
                    <input
                      type="text"
                      value={formData.collocationLocation}
                      onChange={(e) => setFormData({ ...formData, collocationLocation: e.target.value })}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Luogo attuale di conservazione"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Periodo Storico
                    </label>
                    <select
                      value={formData.period}
                      onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Seleziona periodo</option>
                      {HISTORICAL_PERIODS.map(period => (
                        <option key={period.value} value={period.value}>
                          {period.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data
                    </label>
                    <input
                      type="text"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="es. 1520, XVI secolo, 1500-1550"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Materiali
                    </label>
                    <input
                      type="text"
                      value={formData.materials}
                      onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="es. Pergamena, inchiostro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dimensioni
                    </label>
                    <input
                      type="text"
                      value={formData.dimensions}
                      onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="es. 30x21 cm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Condizioni
                    </label>
                    <select
                      value={formData.conditions}
                      onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Seleziona condizione</option>
                      <option value="ottimo">Ottimo</option>
                      <option value="buono">Buono</option>
                      <option value="discreto">Discreto</option>
                      <option value="danneggiato">Danneggiato</option>
                      <option value="restaurato">Restaurato</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Provenienza
                  </label>
                  <textarea
                    value={formData.provenance}
                    onChange={(e) => setFormData({ ...formData, provenance: e.target.value })}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={2}
                    placeholder="Storia e provenienza del documento"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Metadati dell'Immagine</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Questi metadati verranno salvati nell'immagine e saranno ricercabili
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Trascrizione
                  </label>
                  <textarea
                    value={formData.transcription}
                    onChange={(e) => setFormData({ ...formData, transcription: e.target.value })}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={4}
                    placeholder="Trascrizione del testo nell'immagine..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Note / Bibliografia
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={3}
                    placeholder="Note / Bibliografia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Parole Chiave (Keywords)
                  </label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="manoscritto, antico, latino (separate da virgola)"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Inserisci parole chiave separate da virgola
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 dark:border-gray-600 px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 font-medium"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-blue-600 dark:bg-blue-500 px-6 py-2.5 text-white hover:bg-blue-700 dark:hover:bg-blue-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Salvando..." : "Salva Modifiche"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}



