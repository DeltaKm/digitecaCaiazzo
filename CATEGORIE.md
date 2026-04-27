# Sistema di Categorie Digiteca

## 📚 Struttura Gerarchica

Digiteca utilizza un sistema di categorie a due livelli: **Categoria principale** e **Sottocategoria**.

### 1. 📁 Archivi
Documenti d'archivio e materiali storici
- `amministrativi` - Documenti amministrativi
- `carteggi` - Corrispondenza e lettere
- `mappe` - Mappe e planimetrie storiche
- `notarili` - Atti notarili
- `pergamene` - Pergamene antiche
- `registri` - Registri e libri contabili

### 2. 🎵 Audio
Registrazioni audio storiche e documentali
- `interviste` - Interviste registrate
- `memorie` - Testimonianze orali
- `musiche` - Registrazioni musicali
- `storiche` - Audio di valore storico
- `suoni` - Suoni e paesaggi sonori

### 3. 📖 Biblioteca
Materiali bibliografici e documentali
- `cartografia` - Carte geografiche e atlanti
- `cataloghi` - Cataloghi e indici
- `ebook` - Libri digitali
- `libri` - Libri fisici digitalizzati
- `manoscritti` - Manoscritti e codici
- `multimediali` - Pubblicazioni multimediali
- `opuscoli` - Opuscoli e pamphlet
- `periodici` - Riviste e giornali

### 4. 🖼️ Immagini
Materiale fotografico e iconografico
- `cartoline` - Cartoline storiche
- `diapositive` - Diapositive fotografiche
- `grafica` - Materiale grafico
- `gruppi` - Fotografie di gruppo
- `illustrazioni` - Illustrazioni e disegni
- `recenti` - Fotografie recenti
- `ritratti` - Ritratti fotografici
- `storiche` - Fotografie storiche

### 5. 🏺 Kere
Oggetti e cultura materiale
- `arredi` - Arredi e mobili
- `attrezzi` - Attrezzi da lavoro
- `multimediali` - Oggetti multimediali
- `pratiche` - Oggetti d'uso quotidiano
- `religione` - Oggetti religiosi
- `tradizioni` - Oggetti legati alle tradizioni
- `utensili` - Utensili vari

### 6. 📋 Materiali
Materiali educativi e divulgativi
- `animazioni` - Animazioni e video interattivi
- `didattici` - Materiali didattici
- `media` - Materiali mediatici
- `mostre` - Materiali per mostre
- `pannelli` - Pannelli espositivi
- `supporti` - Supporti didattici

### 7. 🌳 Radici
Ricerche genealogiche e storie familiari
- `biografie` - Biografie personali
- `documenti` - Documenti familiari
- `famiglie` - Storie di famiglie
- `fotografie` - Fotografie familiari
- `genealogie` - Alberi genealogici
- `memorie` - Memorie familiari
- `persone` - Storie di persone
- `storie` - Storie locali

### 8. 📝 Regesti
Sommari e descrizioni di documenti
- `abstract` - Abstract e riassunti
- `corredi` - Corredi documentari
- `edizioni` - Edizioni critiche
- `regesti` - Regesti documentari
- `traduzioni` - Traduzioni di documenti
- `trascrizioni` - Trascrizioni paleografiche

### 9. 🎬 Video
Materiale video documentale
- `documentari` - Documentari
- `eventi` - Registrazioni di eventi
- `interviste` - Interviste video
- `manifestazioni` - Manifestazioni pubbliche
- `reportage` - Reportage video
- `spettacoli` - Spettacoli e performance

## 🔧 Utilizzo nel Codice

### Importare le categorie

```typescript
import { CATEGORIES, getCategoryById, getCategoryName } from '@/lib/categories'
```

### Ottenere tutte le categorie

```typescript
const categories = CATEGORIES
// Restituisce array di oggetti con id, name, subcategories
```

### Ottenere una categoria specifica

```typescript
const category = getCategoryById('archivi')
// Restituisce: { id: 'archivi', name: 'Archivi', subcategories: [...] }
```

### Validare categoria e sottocategoria

```typescript
import { validateCategorySubcategory } from '@/lib/categories'

const isValid = validateCategorySubcategory('archivi', 'notarili')
// Restituisce: true
```

### In un form

```tsx
<select onChange={(e) => setCategory(e.target.value)}>
  {CATEGORIES.map(cat => (
    <option key={cat.id} value={cat.id}>
      {cat.name}
    </option>
  ))}
</select>

{/* Sottocategorie filtrate */}
<select>
  {getCategoryById(selectedCategory)?.subcategories.map(sub => (
    <option key={sub} value={sub}>
      {sub.charAt(0).toUpperCase() + sub.slice(1)}
    </option>
  ))}
</select>
```

## 📊 Schema Database

```prisma
model Document {
  category     String   // ID categoria (es: "archivi")
  subcategory  String   // ID sottocategoria (es: "notarili")
  // ... altri campi
}
```

## 🎯 Best Practices

1. **Sempre usare gli ID** - Non usare mai i nomi visualizzati come valori
2. **Validare input** - Verificare che categoria e sottocategoria siano valide
3. **Capitalizzazione** - Mostrare le sottocategorie con la prima lettera maiuscola nell'UI
4. **Filtri dipendenti** - Le sottocategorie devono dipendere dalla categoria selezionata

## 📝 Esempi Completi

### Creare un documento

```typescript
const newDocument = await prisma.document.create({
  data: {
    title: "Atto notarile 1703",
    category: "archivi",
    subcategory: "notarili",
    // ... altri campi
  }
})
```

### Filtrare documenti

```typescript
const documents = await prisma.document.findMany({
  where: {
    category: "archivi",
    subcategory: "notarili"
  }
})
```

### Mostrare categoria nell'UI

```tsx
import { getCategoryName } from '@/lib/categories'

<span>{getCategoryName(document.category)}</span>
// Mostra: "Archivi" invece di "archivi"
```
