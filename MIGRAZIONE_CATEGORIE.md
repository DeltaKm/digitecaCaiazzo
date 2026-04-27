# Migrazione Categorie a Database

## Modifiche Implementate

### ✅ 1. Schema Database
Aggiunto nuovo modello `Category` in `prisma/schema.prisma`:
- `categoryId`: ID univoco leggibile (es: "archivi", "audio")
- `name`: Nome visualizzato della categoria
- `subcategories`: Array di sottocategorie
- `order`: Ordine di visualizzazione
- Timestamp di creazione e aggiornamento

### ✅ 2. API Aggiornata
File `app/api/categories/route.ts` completamente riscritto:
- **GET**: Restituisce tutte le categorie dal database
- **POST**: Crea nuove categorie o aggiunge sottocategorie
- **PATCH**: Modifica/elimina categorie e sottocategorie
- Gestisce automaticamente i file in Google Cloud Storage

### ✅ 3. Componenti Aggiornati
- `CategoryManagerModal.tsx`: Carica categorie dall'API, operazioni CRUD funzionanti
- `UploadModal.tsx`: Carica categorie dinamicamente dall'API
- `EditDocumentModal.tsx`: Carica categorie dinamicamente dall'API

### ✅ 4. File Helper
`lib/categories.ts`: Mantiene funzioni helper per compatibilità e dati per migrazione iniziale

### ✅ 5. Script Migrazione
`scripts/migrate-categories.ts`: Script per migrare categorie dal file al database

## Come Usare

### Prima Migrazione (già eseguita)
```bash
npx prisma generate
npx tsx scripts/migrate-categories.ts
```

### Deploy su Vercel
1. Assicurati che `DATABASE_URL` sia configurata nelle variabili d'ambiente
2. Aggiungi questo comando al build:
```json
{
  "scripts": {
    "build": "prisma generate && npx tsx scripts/migrate-categories.ts && next build"
  }
}
```

### Gestione Categorie
Le categorie ora possono essere modificate:
- ✅ Direttamente dall'interfaccia admin (pannello Impostazioni)
- ✅ Le modifiche vengono salvate nel database MongoDB
- ✅ Funziona perfettamente in produzione su Vercel
- ✅ I file in Google Cloud Storage vengono rinominati/eliminati automaticamente

### Cosa Cambia
**PRIMA** (❌ Non funzionava su Vercel):
- Categorie salvate in `lib/categories.ts`
- Modifiche richiedevano modifica del file
- Impossibile modificare in produzione (read-only)

**DOPO** (✅ Funziona su Vercel):
- Categorie salvate in MongoDB
- Modifiche tramite API REST
- Funziona perfettamente in produzione
- Nessuna modifica di file necessaria

## Problemi Risolti
✅ Errore "Impossibile modificare file categories.ts" su Vercel
✅ Le modifiche alle categorie ora sono persistenti
✅ Funziona in ambienti read-only (Vercel, Docker, etc.)
