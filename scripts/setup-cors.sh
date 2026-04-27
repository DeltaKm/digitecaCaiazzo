#!/bin/bash

# Script per configurare CORS su Google Cloud Storage bucket
# Permette upload diretti dal browser senza passare per Vercel

BUCKET_NAME="digiteca-objects"

echo "🔧 Configurazione CORS per il bucket $BUCKET_NAME..."

# Configura CORS
gcloud storage buckets update gs://$BUCKET_NAME --cors-file=cors-config.json

echo "✅ CORS configurato con successo!"
echo ""
echo "📋 Verifica la configurazione:"
echo "gcloud storage buckets describe gs://$BUCKET_NAME --format=\"default(cors_config)\""
