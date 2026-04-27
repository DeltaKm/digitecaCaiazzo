# Sistema di Storage Google Cloud Storage

## Struttura delle Cartelle

I file vengono organizzati in una struttura gerarchica per ottimizzare il recupero e la gestione:

```
digiteka-objects/
├── categoria/
│   ├── sottocategoria/
│   │   ├── periodo/
│   │   │   ├── anno/
│   │   │   │   ├── mese/
│   │   │   │   │   ├── stato/
│   │   │   │   │   │   └── files...
```

### Esempio Pratico

```
digiteka-objects/
├── immagini/
│   ├── fotografie/
│   │   ├── epoca-moderna/
│   │   │   ├── 2024/
│   │   │   │   ├── 01/
│   │   │   │   │   ├── pubblicato/
│   │   │   │   │   │   ├── doc123_1704123456_foto1.jpg
│   │   │   │   │   │   └── doc123_1704123457_foto2.jpg
│   │   │   │   │   └── bozza/
│   │   │   │   │       └── doc124_1704123458_foto3.jpg
│   │   │   │   └── 02/
│   │   │   │       └── pubblicato/
│   │   │   │           └── doc125_1706723456_foto4.jpg
```

## Vantaggi della Struttura

### 1. Filtri Veloci
Puoi filtrare i file direttamente dal path senza query al database:

```typescript
// Tutti i documenti pubblicati di una categoria
listFilesByFilter({ 
  category: 'immagini', 
  status: 'pubblicato' 
})

// Documenti di un periodo specifico
listFilesByFilter({ 
  category: 'immagini',
  subcategory: 'fotografie',
  period: 'epoca-moderna'
})

// Documenti di un mese specifico
listFilesByFilter({ 
  category: 'immagini',
  year: 2024,
  month: 1
})
```

### 2. Organizzazione Automatica
Quando lo stato di un documento cambia, il file viene spostato:

```typescript
// Da bozza a pubblicato
moveFile(
  'immagini/fotografie/epoca-moderna/2024/01/bozza/doc123_file.jpg',
  'immagini/fotografie/epoca-moderna/2024/01/pubblicato/doc123_file.jpg'
)
```

### 3. Statistiche Rapide
Puoi ottenere statistiche senza query pesanti:

```typescript
// Conta documenti pubblicati per categoria
const files = await listFiles('immagini/')
const pubblicati = files.filter(f => f.includes('/pubblicato/'))

// Documenti per periodo
const moderniPubblicati = await listFiles('immagini/fotografie/epoca-moderna/')
```

## Funzioni Disponibili

### `generateStoragePath(metadata)`
Genera il path completo per un file basato sui suoi metadati.

```typescript
const path = generateStoragePath({
  category: 'immagini',
  subcategory: 'fotografie',
  period: 'epoca-moderna',
  status: 'pubblicato',
  createdAt: new Date(),
  filename: 'doc123_1704123456_foto.jpg'
})
// Output: immagini/fotografie/epoca-moderna/2024/01/pubblicato/doc123_1704123456_foto.jpg
```

### `uploadFile(buffer, path, contentType)`
Carica un file su GCS e lo rende pubblico.

```typescript
const url = await uploadFile(
  fileBuffer,
  'immagini/fotografie/epoca-moderna/2024/01/pubblicato/foto.jpg',
  'image/jpeg'
)
// Output: https://storage.googleapis.com/digiteka-objects/immagini/...
```

### `deleteFile(path)`
Elimina un file da GCS.

```typescript
await deleteFile('immagini/fotografie/epoca-moderna/2024/01/bozza/foto.jpg')
```

### `moveFile(oldPath, newPath)`
Sposta un file da una posizione all'altra (utile per cambi di stato).

```typescript
const newUrl = await moveFile(
  'immagini/fotografie/epoca-moderna/2024/01/bozza/foto.jpg',
  'immagini/fotografie/epoca-moderna/2024/01/pubblicato/foto.jpg'
)
```

### `listFilesByFilter(filters)`
Lista file con filtri gerarchici.

```typescript
// Tutti i file di una categoria
const files = await listFilesByFilter({ category: 'immagini' })

// File specifici per periodo e stato
const files = await listFilesByFilter({
  category: 'immagini',
  subcategory: 'fotografie',
  period: 'epoca-moderna',
  status: 'pubblicato'
})

// File di un mese specifico
const files = await listFilesByFilter({
  category: 'immagini',
  year: 2024,
  month: 1
})
```

## Configurazione

### Variabili d'Ambiente (.env)

```env
STORAGE_PROVIDER=gcs
GCS_BUCKET=digiteka-objects
GCS_PROJECT_ID=digiteka-480317
GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcs-key.json
```

### File delle Credenziali

Il file `gcs-key.json` contiene le credenziali del service account di Google Cloud.
**IMPORTANTE**: Mai committare questo file su Git! È già nel `.gitignore`.

## API Endpoints

### POST /api/upload
Upload di un file con metadati.

```typescript
const formData = new FormData()
formData.append('file', fileBlob)
formData.append('documentId', 'doc123')
formData.append('category', 'immagini')
formData.append('subcategory', 'fotografie')
formData.append('period', 'epoca-moderna')
formData.append('status', 'pubblicato')

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
})
```

## Best Practices

1. **Nomi File Univoci**: Usa sempre `documentId_timestamp_filename` per evitare collisioni
2. **Pulizia dei Nomi**: I caratteri speciali vengono sostituiti con `-` nei path
3. **Cache Control**: I file sono serviti con cache di 1 anno (31536000 secondi)
4. **Public Access**: Tutti i file caricati sono automaticamente pubblici
5. **Formato Consistente**: Tutte le date usano anno a 4 cifre e mese con zero-padding (01-12)

## Manutenzione

### Pulizia File Orfani
Per trovare file su GCS non referenziati nel database:

```typescript
// TODO: Implementare script di pulizia
const allGcsFiles = await listFiles('')
const dbUrls = await prisma.image.findMany({ select: { url: true } })
const orphanedFiles = allGcsFiles.filter(/* logica di confronto */)
```

### Migrazione Stato
Quando un documento cambia stato, aggiorna anche la posizione del file:

```typescript
// Nel tuo handler di update
if (oldStatus !== newStatus) {
  const oldPath = extractPathFromUrl(image.url)
  const newPath = oldPath.replace(`/${oldStatus}/`, `/${newStatus}/`)
  const newUrl = await moveFile(oldPath, newPath)
  await prisma.image.update({
    where: { id: image.id },
    data: { url: newUrl }
  })
}
```
