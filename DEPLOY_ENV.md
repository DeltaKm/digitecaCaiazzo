# Configurazione Variabili d'Ambiente per Deploy

## 🚨 IMPORTANTE: Configurazione su Vercel

Quando fai il deploy su Vercel, devi configurare queste variabili d'ambiente nel dashboard:

### 1. Vai su Vercel Dashboard
1. Seleziona il progetto `digiteca_next`
2. Vai su **Settings** → **Environment Variables**

### 2. Aggiungi queste variabili (Production)

```env
# URL Base - FONDAMENTALE!
NEXT_PUBLIC_BASE_URL=https://digiteca.comunedicaiazzo.it
NEXTAUTH_URL=https://digiteca.comunedicaiazzo.it
NEXTAUTH_SECRET=8jaaywf5yp+hoPVldAUNQ6dGk7tiDMcZYA2tPQT6XS8=

# Database
DATABASE_URL=mongodb+srv://user:ShadowCmh2025%40%21@cluster0.0flua7d.mongodb.net/digiteka
PRISMA_ENGINE_TYPE=binary

# Storage
STORAGE_PROVIDER=gcs
GCS_BUCKET=digiteca-objects
GCS_PROJECT_ID=digiteca-480317

# OAuth (opzionale)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### 3. Per il file GCS Key

Il file `gcs-key.json` non può essere caricato come file su Vercel. Devi:

1. Copiare il contenuto del file `gcs-key.json`
2. Aggiungerlo come variabile d'ambiente `GCS_SERVICE_ACCOUNT_KEY`
3. Modificare il codice per leggere da questa variabile invece che dal file

**OPPURE** usa Vercel Secrets per file sensibili.

## 📝 File .env Locali

### `.env.local` (Solo sviluppo locale - NON committare)
- Usa `http://localhost:3000`
- Viene ignorato da git
- Sovrascrive `.env`

### `.env.production` (Opzionale)
- Usa `https://digiteca.comunedicaiazzo.it`
- Può essere committato (senza secrets!)
- Usato durante il build di produzione

### `.env` (Default)
- Attualmente punta a produzione
- Viene ignorato da git
- Valori di fallback

## ✅ Checklist Deploy

- [ ] Variabili d'ambiente configurate su Vercel
- [ ] `NEXT_PUBLIC_BASE_URL` punta al dominio corretto
- [ ] `NEXTAUTH_URL` punta al dominio corretto
- [ ] GCS credentials configurate
- [ ] Test logout → NON deve reindirizzare a localhost
- [ ] Test manifest IIIF → URL devono puntare al dominio di produzione

## 🔍 Debug

Se dopo il logout vieni reindirizzato a localhost:
1. Verifica che `NEXT_PUBLIC_BASE_URL` sia impostata su Vercel
2. Fai un redeploy dopo aver modificato le variabili
3. Controlla i log di Vercel per errori

Se i manifest IIIF hanno URL localhost:
1. Verifica `NEXT_PUBLIC_BASE_URL` su Vercel
2. Controlla che il dominio custom sia configurato correttamente
3. Verifica che `x-forwarded-proto` e `host` headers siano corretti
