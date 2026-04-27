/**
 * Script per configurare il bucket Google Cloud Storage come pubblico
 * 
 * Esegui questo script una sola volta per rendere pubblico il bucket:
 * npx tsx scripts/configure-gcs-bucket.ts
 */

import 'dotenv/config'
import { Storage } from '@google-cloud/storage'

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
})

const bucketName = process.env.GCS_BUCKET || 'digiteca-objects'

async function configureBucket() {
  try {
    const bucket = storage.bucket(bucketName)

    console.log(`Configurando il bucket: ${bucketName}...`)

    // Aggiungi la policy IAM per rendere il bucket pubblico in lettura
    await bucket.iam.setPolicy({
      bindings: [
        {
          role: 'roles/storage.objectViewer',
          members: ['allUsers'],
        },
      ],
    })

    console.log('✅ Bucket configurato correttamente!')
    console.log(`✅ Tutti i file caricati su ${bucketName} saranno pubblicamente accessibili`)
    console.log('')
    console.log('Nota: Con Uniform Bucket-Level Access, tutti i file nel bucket')
    console.log('      ereditano automaticamente le permissions del bucket.')
  } catch (error) {
    console.error('❌ Errore durante la configurazione del bucket:', error)
    console.log('')
    console.log('💡 Se ricevi un errore di permessi, assicurati che il service account abbia:')
    console.log('   - Storage Admin role')
    console.log('   - O almeno Storage Object Admin + Storage Legacy Bucket Owner')
  }
}

configureBucket()
