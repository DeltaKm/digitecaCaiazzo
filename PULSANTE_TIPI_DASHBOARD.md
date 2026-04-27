# Pulsante Gestione Tipi di Documento nella Dashboard

## Modifiche Implementate

### Componente: FilesManagerClient.tsx

#### 1. Import Aggiunto
```tsx
import { FileType } from "lucide-react"
import DocumentTypeManagerModal from "./DocumentTypeManagerModal"
```

#### 2. State Aggiunto
```tsx
const [isDocumentTypeModalOpen, setIsDocumentTypeModalOpen] = useState(false)
```

#### 3. Nuovo Pulsante nell'Header
**Posizione:** Tra "Nuova Categoria" e il pulsante di cambio vista

```tsx
<button 
  onClick={() => setIsDocumentTypeModalOpen(true)}
  className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
>
  <FileType className="h-4 w-4" />
  Tipi Documento
</button>
```

**Stile:**
- Colore verde per distinguerlo dal blu delle categorie
- Icona FileType da lucide-react
- Responsive con gap e padding consistenti

#### 4. Modal Integrato
Aggiunto alla fine del componente (prima della chiusura del return):

```tsx
<DocumentTypeManagerModal
  isOpen={isDocumentTypeModalOpen}
  onClose={() => setIsDocumentTypeModalOpen(false)}
  onTypesUpdated={() => {
    window.location.reload()
  }}
/>
```

## Interfaccia Utente

### Layout Header Dashboard
```
┌─────────────────────────────────────────────────────────┐
│  Gestione Categorie                                      │
│  Amministra le categorie e i documenti dell'archivio     │
│                                                          │
│  [+ Nuova Categoria] [📄 Tipi Documento] [🔲 Vista]    │
└─────────────────────────────────────────────────────────┘
```

### Colori dei Pulsanti
- **Nuova Categoria**: Blu (`bg-blue-600`)
- **Tipi Documento**: Verde (`bg-green-600`) ⭐ NUOVO
- **Vista**: Bordo grigio (`border-gray-300`)

## Funzionalità

### Quando l'admin clicca su "Tipi Documento":
1. ✅ Si apre il modal `DocumentTypeManagerModal`
2. ✅ Può visualizzare tutti i tipi esistenti
3. ✅ Può aggiungere nuovi tipi
4. ✅ Può eliminare tipi esistenti
5. ✅ Può riordinare i tipi (↑↓)
6. ✅ Alla chiusura/modifica, la pagina si ricarica per aggiornare i dati

## Percorso di Accesso

**URL:** `/dashboard`

**Requisiti:**
- ✅ Autenticazione obbligatoria
- ✅ Ruolo admin richiesto

**Percorso completo:**
```
Dashboard (Admin)
└── Gestione Categorie
    ├── [+ Nuova Categoria]     ← Gestisce categorie
    ├── [📄 Tipi Documento]     ← Gestisce tipi documento ⭐ NUOVO
    └── [🔲 Vista]              ← Cambia visualizzazione
```

## Vantaggi

### Prima
- ❌ I tipi si gestivano solo da Settings
- ❌ Percorso lungo: Dashboard → Settings → Gestisci Tipi

### Dopo
- ✅ Accesso diretto dalla dashboard categorie
- ✅ Gestione centralizzata nello stesso posto
- ✅ Workflow più fluido per l'admin
- ✅ Coerenza: categorie e tipi nella stessa schermata

## Testing

Per testare la nuova funzionalità:

1. Accedi come admin
2. Vai su `/dashboard`
3. Clicca sul pulsante verde **"Tipi Documento"**
4. Prova ad aggiungere un nuovo tipo (es: "Cartografia storica")
5. Verifica che appaia nelle select quando carichi/modifichi documenti
6. Prova a riordinare i tipi con le frecce ↑↓
7. Prova a eliminare un tipo

## Note Tecniche

- Il pulsante usa l'icona `FileType` da `lucide-react`
- Il colore verde è stato scelto per differenziare visivamente da "Nuova Categoria" (blu)
- Il modal si chiude automaticamente quando l'utente clicca su "Chiudi" o fuori dal modal
- Quando i tipi vengono modificati, la pagina si ricarica per garantire la consistenza dei dati
- Il componente `DocumentTypeManagerModal` è riutilizzabile anche in altre parti dell'app
