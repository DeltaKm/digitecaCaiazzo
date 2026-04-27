# Digiteca - Archivio Digitale con Mirador IIIF

Un archivio digitale professionale per visualizzare documenti e immagini ad alta risoluzione usando il visualizzatore IIIF Mirador.

## 🚀 Tecnologie utilizzate

- **Next.js 15** - Framework React con App Router e Server Components
- **TypeScript** - Type safety
- **NextAuth v5** - Sistema di autenticazione con ruoli admin
- **Prisma** - ORM per MongoDB
- **MongoDB** - Database NoSQL
- **Mirador 3** - Visualizzatore IIIF per immagini ad alta definizione
- **Tailwind CSS** - Styling moderno
- **Lucide React** - Icone

## 📋 Caratteristiche

### 👥 Per tutti gli utenti
- **Consultazione pubblica** - Visualizzazione dell'archivio senza autenticazione
- **Ricerca avanzata** - Filtri per categoria, periodo e formato
- **Visualizzatore Mirador** - Zoom avanzato per immagini ad alta risoluzione
- **Interfaccia intuitiva** - Design moderno ispirato agli archivi digitali professionali

### 👨‍💼 Per gli amministratori
- **Dashboard admin** - Gestione completa dei documenti
- **Caricamento documenti** - Upload di nuovi documenti con manifest IIIF
- **Gestione pubblicazioni** - Pubblicare/nascondere documenti
- **Statistiche** - Monitoraggio documenti e immagini caricate

## 🗄️ Struttura Database

### User
- Gestione utenti con ruoli (`user` o `admin`)
- Integrazione NextAuth per OAuth e credentials

### Document
- Titolo, descrizione, categoria, formato, periodo
- Identificatore univoco
- URL manifest IIIF
- Stato di pubblicazione

### Image
- Immagini ad alta risoluzione collegate ai documenti
- Metadata: dimensioni, formato, ordine

## 🛠️ Installazione

1. **Installa le dipendenze**
```bash
npm install
```

2. **Configura le variabili d'ambiente**

Il file `.env` è già configurato con:
```env
DATABASE_URL="mongodb+srv://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
```

3. **Sincronizza il database**
```bash
npx prisma db push
npx prisma generate
```

4. **Avvia il server**
```bash
npm run dev
```

## 🎯 Struttura del Progetto

```
digiteka_next/
├── app/
│   ├── page.tsx                    # Home pubblica con archivio
│   ├── viewer/[id]/               # Visualizzatore Mirador
│   ├── dashboard/                 # Dashboard utente/admin
│   ├── admin/
│   │   └── upload/               # Form caricamento documenti
│   └── api/
│       ├── auth/[...nextauth]/   # API NextAuth
│       └── documents/            # API CRUD documenti
├── components/
│   ├── DocumentCard.tsx          # Card documento nella griglia
│   ├── MiradorViewer.tsx         # Componente Mirador
│   └── SignOutButton.tsx         # Pulsante logout
├── lib/
│   └── prisma.ts                 # Client Prisma
├── prisma/
│   └── schema.prisma             # Schema database
├── auth.ts                       # Configurazione NextAuth
└── middleware.ts                 # Protezione route
```

## 👨‍💼 Creare un utente Admin

Per impostare un utente come amministratore:

1. Accedi con un account (Google/GitHub/Credentials)
2. Trova l'utente nel database MongoDB
3. Modifica il campo `role` da `"user"` a `"admin"`

Oppure usa MongoDB Compass o il comando:

```javascript
db.User.updateOne(
  { email: "tua@email.com" },
  { $set: { role: "admin" } }
)
```

## 📤 Caricare Documenti

### Requisiti per il caricamento:
1. **Manifest IIIF** - URL al manifest JSON del documento
2. **Metadati** - Titolo, categoria, formato, periodo
3. **Thumbnail** - URL immagine di anteprima
4. **Immagini** - Array di URL immagini ad alta risoluzione

### Formato Manifest IIIF

Il progetto supporta IIIF Presentation API 2.0 e 3.0. Esempio di manifest:

```json
{
  "@context": "http://iiif.io/api/presentation/3/context.json",
  "id": "https://example.com/manifest.json",
  "type": "Manifest",
  "label": { "it": ["Titolo Documento"] },
  "items": [
    {
      "id": "https://example.com/canvas/1",
      "type": "Canvas",
      "items": [...]
    }
  ]
}
```

## 🔐 Autenticazione e Autorizzazione

### Livelli di accesso:

1. **Pubblico** - Visualizzazione archivio e documenti
2. **Utente autenticato** - Accesso alla dashboard personale
3. **Admin** - Caricamento e gestione documenti

### Protezione route:

- `/dashboard` - Solo utenti autenticati
- `/admin/*` - Solo amministratori
- `/viewer/*` - Pubblico (documenti pubblicati)
- `/` - Pubblico

## 🎨 Personalizzazione

### Modificare categorie e formati

Le categorie e formati sono dinamici e basati sui documenti caricati. Per aggiungere valori predefiniti, modifica:

- `app/page.tsx` - Filtri nella home
- `app/admin/upload/page.tsx` - Form di caricamento

### Personalizzare Mirador

Modifica la configurazione in `components/MiradorViewer.tsx`:

```typescript
const config = {
  window: {
    allowClose: false,
    allowMaximize: true,
    allowFullscreen: true,
  },
  workspace: {
    showZoomControls: true,
  },
  // ... altre opzioni
}
```

## 📊 API Endpoints

### GET /api/documents
Recupera tutti i documenti pubblicati

### POST /api/documents
Crea un nuovo documento (solo admin)

### GET /api/documents/[id]
Recupera un documento specifico

### PUT /api/documents/[id]
Aggiorna un documento (solo admin)

### DELETE /api/documents/[id]
Elimina un documento (solo admin)

## 🚢 Deploy

### Vercel (consigliato)

1. Push su GitHub
2. Importa su [Vercel](https://vercel.com)
3. Configura le variabili d'ambiente
4. Aggiorna `NEXTAUTH_URL` con l'URL di produzione

### Variabili d'ambiente per produzione:
```env
DATABASE_URL="mongodb+srv://..."
NEXTAUTH_URL="https://tuodominio.com"
NEXTAUTH_SECRET="..." 
GOOGLE_CLIENT_ID="..." # Opzionale
GOOGLE_CLIENT_SECRET="..." # Opzionale
GITHUB_CLIENT_ID="..." # Opzionale
GITHUB_CLIENT_SECRET="..." # Opzionale
```

## 📚 Risorse IIIF

- [IIIF Presentation API](https://iiif.io/api/presentation/3.0/)
- [Mirador Documentation](https://projectmirador.org/)
- [IIIF Image API](https://iiif.io/api/image/3.0/)

## 🐛 Troubleshooting

### Mirador non si carica
- Verifica che il manifest IIIF sia valido
- Controlla la console del browser per errori
- Assicurati che l'URL del manifest sia accessibile

### Documenti non visibili
- Verifica che `published` sia `true`
- Controlla i permessi utente
- Verifica la connessione al database

### Errori di autenticazione
- Rigenera `NEXTAUTH_SECRET`
- Verifica le URL callback per OAuth
- Controlla le credenziali nel file `.env`

## 📄 Licenza

Questo progetto è open source e disponibile sotto licenza MIT.

## 🚀 Tecnologie utilizzate

- **Next.js 15** - Framework React con App Router
- **TypeScript** - Type safety
- **NextAuth v5** - Autenticazione completa
- **Prisma** - ORM per MongoDB
- **MongoDB** - Database NoSQL
- **Tailwind CSS** - Styling

## 📋 Prerequisiti

- Node.js 18+ installato
- Account MongoDB (puoi usare MongoDB Atlas gratuitamente)
- (Opzionale) Account Google/GitHub per OAuth

## 🛠️ Installazione

1. **Installa le dipendenze**
```bash
npm install
```

2. **Configura le variabili d'ambiente**

Copia il file `.env.example` e rinominalo in `.env`, poi compila i valori:

```env
# Database MongoDB
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-un-secret-con: openssl rand -base64 32"

# OAuth Providers (opzionali)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

3. **Genera il Prisma Client**
```bash
npx prisma generate
```

4. **Sincronizza il database**
```bash
npx prisma db push
```

## 🎯 Utilizzo

### Avviare il server di sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel tuo browser.

### Struttura del progetto

```
digiteka_next/
├── app/
│   ├── api/
│   │   └── auth/[...nextauth]/  # API routes NextAuth
│   ├── auth/
│   │   └── signin/              # Pagina di login
│   ├── dashboard/               # Pagina protetta
│   └── page.tsx                 # Home page
├── components/
│   └── SignOutButton.tsx        # Componente logout
├── lib/
│   └── prisma.ts                # Client Prisma
├── prisma/
│   └── schema.prisma            # Schema database
├── auth.ts                      # Configurazione NextAuth
└── middleware.ts                # Middleware di protezione
```

## 🔐 Autenticazione

Il progetto supporta tre metodi di autenticazione:

### 1. Credentials (Email/Password)
- Login con email e password
- Da implementare: hash delle password con bcrypt

### 2. Google OAuth
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto
3. Abilita Google+ API
4. Crea credenziali OAuth 2.0
5. Aggiungi `http://localhost:3000/api/auth/callback/google` come redirect URI
6. Copia Client ID e Client Secret nel file `.env`

### 3. GitHub OAuth
1. Vai su [GitHub Settings > Developer settings](https://github.com/settings/developers)
2. Crea una nuova OAuth App
3. Usa `http://localhost:3000/api/auth/callback/github` come callback URL
4. Copia Client ID e Client Secret nel file `.env`

## 📊 Database

Lo schema Prisma include i modelli necessari per NextAuth:

- **User** - Informazioni utente
- **Account** - Account OAuth
- **Session** - Sessioni utente
- **VerificationToken** - Token di verifica

## 🔒 Protezione delle Route

Il middleware protegge automaticamente le route che iniziano con `/dashboard`. Gli utenti non autenticati vengono reindirizzati alla pagina di login.

## 📝 Script disponibili

- `npm run dev` - Avvia il server di sviluppo
- `npm run build` - Build di produzione
- `npm run start` - Avvia il server di produzione
- `npm run lint` - Esegue il linter

## 🎨 Personalizzazione

### Modificare i provider OAuth

Modifica il file `auth.ts` per aggiungere o rimuovere provider di autenticazione.

### Modificare lo schema del database

1. Modifica `prisma/schema.prisma`
2. Esegui `npx prisma db push` per sincronizzare
3. Esegui `npx prisma generate` per aggiornare il client

## 🚢 Deploy

### Vercel (consigliato)

1. Fai push del codice su GitHub
2. Importa il progetto su [Vercel](https://vercel.com)
3. Configura le variabili d'ambiente
4. Deploy automatico!

Ricorda di aggiornare `NEXTAUTH_URL` con l'URL di produzione.

## 📚 Risorse

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## 📄 Licenza

Questo progetto è open source e disponibile sotto licenza MIT.

