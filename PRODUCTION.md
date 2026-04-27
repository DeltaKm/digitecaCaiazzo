# Configurazione Produzione - Digiteca

## Variabili d'Ambiente Vercel

Per il corretto funzionamento in produzione su Vercel, configura le seguenti variabili d'ambiente nel dashboard di Vercel:

### 1. URL Base (IMPORTANTE per IIIF Manifest)
```
NEXT_PUBLIC_BASE_URL=https://digiteca.comunedicaiazzo.it
```
Questa variabile controlla gli URL nei manifest IIIF. **DEVE essere impostata al dominio di produzione**.

### 2. NextAuth
```
NEXTAUTH_URL=https://digiteca.comunedicaiazzo.it
NEXTAUTH_SECRET=<genera-un-secret-sicuro>
```

### 3. Database
```
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/digiteka
PRISMA_ENGINE_TYPE=binary
```

### 4. Google Cloud Storage
```
STORAGE_PROVIDER=gcs
GCS_BUCKET=digiteca-objects
GCS_PROJECT_ID=digiteca-480317
```

Per le credenziali GCS, carica il file `gcs-key.json` e imposta:
```
GOOGLE_APPLICATION_CREDENTIALS=./gcs-key.json
```

## Come Configurare su Vercel

1. Vai su: https://vercel.com/[tuo-account]/digiteca_next/settings/environment-variables
2. Aggiungi ogni variabile cliccando su "Add New"
3. Seleziona l'environment: **Production**, **Preview**, **Development**
4. Salva e rideploy

## Verifica

Dopo il deploy, verifica che i manifest IIIF puntino al dominio corretto:
```
https://digiteca.comunedicaiazzo.it/api/iiif/[document-id]/manifest.json
```

Il campo `"id"` nel manifest JSON deve contenere:
```json
{
  "id": "https://digiteca.comunedicaiazzo.it/api/iiif/[document-id]/manifest.json"
}
```

NON deve contenere `localhost` o `vercel.app`.
