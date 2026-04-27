# Campo "Attribuzione" Aggiunto

## Modifiche Implementate

### 1. Database Schema
**File:** `prisma/schema.prisma`
- Aggiunto campo `attribution` al modello `Document`
- Tipo: `String @default("")`
- Posizione: Dopo il campo `author`

### 2. Migrazione Database
- Eseguito `npx prisma db push` per applicare le modifiche a MongoDB
- Il campo è stato aggiunto a tutti i documenti esistenti con valore di default ""

### 3. API Endpoints Aggiornati

#### POST `/api/documents`
**File:** `app/api/documents/route.ts`
- Aggiunto `attribution` alla destrutturazione del body
- Incluso nel `prisma.document.create()` con default `attribution || ''`

#### PATCH `/api/documents/[id]`
**File:** `app/api/documents/[id]/route.ts`
- Aggiunto `'attribution'` all'array `allowedFields`
- Il campo può essere aggiornato insieme agli altri metadati

### 4. Componenti Frontend Aggiornati

#### UploadModal.tsx
- Aggiunto `attribution: ""` al `formData` iniziale
- Aggiunto campo input nel form dopo "Autore":
  ```tsx
  <label>Attribuzione</label>
  <input
    value={formData.attribution}
    onChange={(e) => setFormData({ ...formData, attribution: e.target.value })}
    placeholder="Attribuzione dell'opera"
  />
  ```
- Il campo viene automaticamente inviato con il resto del formData

#### EditDocumentModal.tsx
- Aggiunto `attribution: ""` al `formData` iniziale
- Aggiunto `attribution: string` all'interfaccia `EditDocumentModalProps`
- Aggiunto campo input nel form (nuova riga con Autore e Attribuzione affiancati)
- Popolato con `document.attribution || ""` all'apertura del modal
- Incluso in `updateData` quando si salva

### 5. Struttura del Form

#### UploadModal
```
Metadati
├── Autore          | Attribuzione
├── Periodo storico | ...
└── ...
```

#### EditDocumentModal
```
Metadati Storici
├── Autore     | Attribuzione
├── Luogo      | ...
└── ...
```

## Utilizzo

### Creazione Documento
1. Nel modal di upload, compilare il campo "Attribuzione" sotto la sezione Metadati
2. Il valore viene salvato automaticamente con il documento

### Modifica Documento
1. Nel modal di modifica, il campo "Attribuzione" mostra il valore esistente
2. Modificare se necessario
3. Salvare per aggiornare

## Note
- Il campo è **opzionale** (stringa vuota di default)
- Supporta testo libero
- Posizionato accanto al campo "Autore" per coerenza semantica
- Disponibile immediatamente per tutti i nuovi documenti
- I documenti esistenti hanno il campo impostato a stringa vuota

## Database
Il campo è ora presente nel modello MongoDB:
```typescript
{
  author: string       // Autore del documento
  attribution: string  // Attribuzione dell'opera ✨ NUOVO
  location: string     // Luogo di origine/conservazione
  // ... altri campi
}
```
