#!/bin/bash

# Script per configurare il bucket Google Cloud Storage

echo "🔧 Configurazione bucket digiteca-objects..."
echo ""

# Disabilita Public Access Prevention
echo "1️⃣ Disabilitando Public Access Prevention..."
gcloud storage buckets update gs://digiteca-objects \
  --no-public-access-prevention

if [ $? -eq 0 ]; then
  echo "✅ Public Access Prevention disabilitato"
else
  echo "❌ Errore: assicurati di essere autenticato con gcloud auth login"
  exit 1
fi

echo ""
echo "2️⃣ Rendendo il bucket pubblico in lettura..."

# Rendi pubblico il bucket
gcloud storage buckets add-iam-policy-binding gs://digiteca-objects \
  --member=allUsers \
  --role=roles/storage.objectViewer

if [ $? -eq 0 ]; then
  echo "✅ Bucket configurato correttamente!"
  echo ""
  echo "🎉 Tutti i file caricati saranno ora pubblicamente accessibili"
else
  echo "❌ Errore nella configurazione IAM"
  exit 1
fi
