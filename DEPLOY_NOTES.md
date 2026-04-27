# 📝 Note di Deploy - Categorie Database

## Importante per il Deploy su Vercel

Le categorie sono ora gestite nel **database MongoDB** invece che nel file `lib/categories.ts`.

### Prima del Deploy

1. **Variabili d'Ambiente su Vercel**
   Assicurati di avere configurato:
   - `DATABASE_URL` - Connessione a MongoDB
   - `GOOGLE_APPLICATION_CREDENTIALS_JSON` - Credenziali GCS
   - Altre variabili necessarie per NextAuth, ecc.

2. **Script di Build**
   Lo script di build in `package.json` già include:
   ```bash
   prisma db push --accept-data-loss && 
   prisma generate && 
   npx tsx scripts/migrate-categories.ts && 
   next build
   ```
   
   Questo assicura che:
   - Lo schema del database sia aggiornato
   - Il client Prisma sia generato
   - Le categorie siano migrate nel database
   - L'applicazione sia compilata

3. **Primo Deploy**
   Al primo deploy, le categorie saranno automaticamente caricate nel database dallo script di migrazione.

### Durante il Deploy

Vercel eseguirà automaticamente:
1. `prisma db push` - Aggiorna lo schema MongoDB
2. `prisma generate` - Genera il client Prisma
3. `migrate-categories.ts` - Popola il database con le categorie
4. `next build` - Compila l'applicazione

### Dopo il Deploy

✅ Le modifiche alle categorie ora funzionano in produzione!
✅ Usa l'interfaccia admin per gestire le categorie
✅ Tutte le operazioni CRUD sono supportate
✅ I file in Google Cloud Storage vengono gestiti automaticamente

### Rollback

Se hai bisogno di tornare alla versione precedente, le categorie statiche sono ancora presenti in `lib/categories.ts` come fallback.

### Debug

Per verificare che le categorie siano state migrate correttamente:
```bash
# Locale
npx tsx scripts/migrate-categories.ts

# O controlla direttamente il database
# Connettiti a MongoDB e verifica la collection "Category"
```

### Problemi Comuni

**Errore: "Cannot read properties of undefined (reading 'findUnique')"**
- Soluzione: Esegui `npx prisma generate` per rigenerare il client

**Categorie non visibili dopo il deploy**
- Soluzione: Verifica che lo script di migrazione sia stato eseguito nei log di Vercel
- Esegui manualmente: `npx tsx scripts/migrate-categories.ts`

**File in GCS non rinominati**
- Soluzione: Verifica le credenziali GCS nelle variabili d'ambiente
