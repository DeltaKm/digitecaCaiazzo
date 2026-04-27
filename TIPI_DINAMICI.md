# Gestione Dinamica Tipi di Documento

## Modifiche Implementate

### 1. Database Schema
- Aggiunto modello `DocumentType` in `prisma/schema.prisma`
- Campi: `id`, `typeId` (unique), `name`, `order`, `createdAt`, `updatedAt`

### 2. API Endpoints
**File:** `app/api/document-types/route.ts`

#### GET `/api/document-types`
- Ritorna tutti i tipi di documento ordinati per `order`
- Accessibile pubblicamente

#### POST `/api/document-types`
- Crea un nuovo tipo di documento
- Richiede autenticazione admin
- Parametri: `typeId`, `name`, `order` (opzionale)

#### DELETE `/api/document-types?id={id}`
- Elimina un tipo di documento
- Richiede autenticazione admin

#### PATCH `/api/document-types`
- Aggiorna un tipo di documento (nome o ordine)
- Richiede autenticazione admin
- Parametri: `typeId`, `name` (opzionale), `order` (opzionale)

### 3. Componenti Modificati

#### Nuovi Componenti
- **`DocumentTypeManagerModal.tsx`**: Interfaccia admin per gestire i tipi
  - Aggiungi nuovo tipo
  - Elimina tipo esistente
  - Riordina tipi (↑ ↓)

- **`SettingsClient.tsx`**: Componente client per la pagina settings
  - Pulsanti per aprire gestione categorie e tipi

#### Componenti Aggiornati
- **`UploadModal.tsx`**: Carica tipi dinamicamente dall'API invece di array statico
- **`EditDocumentModal.tsx`**: Carica tipi dinamicamente dall'API
- **`SearchClient.tsx`**: Carica tipi dinamicamente dall'API per filtri
- **`HomeClient.tsx`**: Carica tipi dinamicamente dall'API per filtri

### 4. Pagina Admin Settings
**File:** `app/admin/settings/page.tsx`

Aggiunta sezione "Gestione Contenuti" con due pulsanti:
- **Gestisci Categorie**: Apre il modal per gestire categorie
- **Gestisci Tipi di Documento**: Apre il modal per gestire tipi

### 5. Script di Seeding
**File:** `scripts/seed-document-types.ts`

Popola il database con i tipi predefiniti:
- Documento Testuale
- Manoscritto
- Immagine
- Fotografia
- Mappa
- Disegno
- Stampa
- Video
- Audio

**Esecuzione:**
```bash
npx tsx scripts/seed-document-types.ts
```

### 6. Vantaggi della Nuova Implementazione

#### Prima (Statico)
- Tipi hardcoded in ogni componente
- Modifiche richiedevano aggiornamenti multipli nel codice
- Non personalizzabile dall'admin
- Nessun controllo sull'ordine di visualizzazione

#### Dopo (Dinamico)
- ✅ Tipi gestiti dal database
- ✅ Single source of truth (API endpoint)
- ✅ Gestione completa dall'interfaccia admin
- ✅ Ordinamento personalizzabile
- ✅ Facile aggiungere/rimuovere tipi senza toccare il codice
- ✅ Coerenza garantita in tutta l'applicazione

## Come Usare

### Per l'Admin
1. Accedi come admin
2. Vai su **Dashboard** → **Settings** (⚙️)
3. Nella sezione "Gestione Contenuti", clicca **Gestisci** accanto a "Tipi di Documento"
4. Nel modal puoi:
   - **Aggiungere** un nuovo tipo (ID + Nome)
   - **Eliminare** un tipo esistente (⚠️ attenzione: potrebbe rompere documenti esistenti)
   - **Riordinare** i tipi usando le frecce ↑ ↓

### Per gli Sviluppatori
I tipi vengono caricati automaticamente nei componenti con:

```typescript
const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])

useEffect(() => {
  const loadDocumentTypes = async () => {
    const response = await fetch('/api/document-types')
    const data = await response.json()
    setDocumentTypes(data)
  }
  loadDocumentTypes()
}, [])
```

Poi usati nelle select:
```tsx
<select>
  <option value="">Seleziona tipo</option>
  {documentTypes.map((type) => (
    <option key={type.id} value={type.typeId}>
      {type.name}
    </option>
  ))}
</select>
```

## Note Importanti

⚠️ **Eliminazione Tipi**: Fare attenzione quando si elimina un tipo, perché potrebbero esserci documenti nel database che lo usano. In futuro si potrebbe aggiungere:
- Controllo documenti che usano il tipo prima di eliminare
- Migrazione automatica a tipo default
- Soft delete invece di hard delete

## Testing

Per testare il sistema:
1. Esegui il seed: `npx tsx scripts/seed-document-types.ts`
2. Accedi come admin
3. Vai su Settings → Gestisci Tipi
4. Prova ad aggiungere un nuovo tipo (es: "Pergamena")
5. Carica un documento e verifica che il nuovo tipo appaia nella select
6. Cerca documenti e verifica che il filtro includa il nuovo tipo
