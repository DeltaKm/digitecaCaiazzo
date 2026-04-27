# Configurazione Google Cloud Storage

## Problema
Il bucket `digiteca-objects` ha **Public Access Prevention** abilitato, che impedisce di rendere pubblici i file.

## Soluzione: Disabilitare Public Access Prevention

### Opzione 1: Console Web (Consigliata)

1. Vai su [Google Cloud Storage Console](https://console.cloud.google.com/storage/browser/)
2. Trova e clicca sul bucket `digiteca-objects`
3. Vai alla tab **"Permissions"** (Autorizzazioni)
4. Clicca su **"Public Access"** nel menu laterale
5. Clicca **"Edit"** (Modifica) accanto a "Public access prevention"
6. Seleziona **"Not enforced"** (Non applicato)
7. Clicca **"Save"** (Salva)

### Opzione 2: gcloud CLI

```bash
gcloud storage buckets update gs://digiteca-objects \
  --no-public-access-prevention
```

### Opzione 3: Rendere pubblico tutto il bucket

Dopo aver disabilitato Public Access Prevention:

```bash
gcloud storage buckets add-iam-policy-binding gs://digiteca-objects \
  --member=allUsers \
  --role=roles/storage.objectViewer
```

## Verifica

Dopo la configurazione, prova a caricare un nuovo documento dalla dashboard.
I file dovrebbero essere accessibili pubblicamente tramite URL tipo:
```
https://storage.googleapis.com/digiteca-objects/categoria/sottocategoria/periodo/2024/01/stato/filename.jpg
```

## Sicurezza

### Se vuoi mantenere Public Access Prevention attivo:

**Opzione A: Usare Signed URLs con refresh periodico**
- Pro: Massima sicurezza, controllo granulare
- Contro: Gli URL scadono dopo 7 giorni, serve un sistema di refresh

**Opzione B: Usare Cloud CDN con Cloud Armor**
- Pro: File pubblici ma protetti da DDoS
- Contro: Costi aggiuntivi, setup più complesso

**Opzione C: Proxy attraverso Next.js API Route**
- Pro: Controllo completo sull'accesso
- Contro: Più carico sul server, latenza maggiore

## Scelta consigliata per questo progetto

Per un archivio digitale pubblico come Digiteca, ti consiglio:
✅ Disabilitare Public Access Prevention
✅ Rendere pubblico il bucket
✅ I file sono organizzati in cartelle e facilmente accessibili

Se hai bisogno di proteggere alcuni file:
- Usa campi `visibility: "privato"` nel database
- Controlla l'accesso a livello applicazione
- Salva file privati in un bucket separato con accesso ristretto
