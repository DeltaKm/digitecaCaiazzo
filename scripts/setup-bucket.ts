/**
 * Script per configurare il bucket GCS usando le credenziali del service account
 */

import 'dotenv/config'
import { Storage } from '@google-cloud/storage'

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
})

const bucketName = process.env.GCS_BUCKET || 'digiteca-objects'

async function setupBucket() {
  try {
    const bucket = storage.bucket(bucketName)

    console.log('🔧 Configurazione bucket:', bucketName)
    console.log('')

    // Step 1: Disabilita Public Access Prevention
    console.log('1️⃣ Disabilitando Public Access Prevention...')
    try {
      await bucket.setMetadata({
        iamConfiguration: {
          publicAccessPrevention: 'inherited',
        },
      })
      console.log('✅ Public Access Prevention disabilitato')
    } catch (error: any) {
      if (error.code === 412) {
        console.log('⚠️  Public Access Prevention già disabilitato o non può essere modificato')
        console.log('   Procedo con il passo successivo...')
      } else {
        throw error
      }
    }

    console.log('')

    // Step 2: Rendi pubblico il bucket usando IAM (non ACL)
    console.log('2️⃣ Rendendo il bucket pubblico in lettura tramite IAM...')
    try {
      const [policy] = await bucket.iam.getPolicy()
      
      // Aggiungi la binding per allUsers con ruolo Storage Object Viewer
      policy.bindings.push({
        role: 'roles/storage.objectViewer',
        members: ['allUsers'],
      })
      
      await bucket.iam.setPolicy(policy)
      console.log('✅ Bucket configurato come pubblico tramite IAM')
    } catch (error: any) {
      if (error.code === 412) {
        console.log('⚠️  Public Access Prevention ancora attivo')
        console.log('')
        console.log('📋 Esegui manualmente dalla console:')
        console.log('   1. Vai su https://console.cloud.google.com/storage/browser/')
        console.log('   2. Clicca su bucket:', bucketName)
        console.log('   3. Vai su Permissions → Public Access → Edit')
        console.log('   4. Seleziona "Not enforced"')
        console.log('   5. Salva')
        console.log('')
        console.log('   Poi riesegui questo script con: npx tsx scripts/setup-bucket.ts')
        return
      }
      throw error
    }

    console.log('')
    console.log('🎉 Bucket configurato con successo!')
    console.log('✅ Tutti i file caricati saranno pubblicamente accessibili')
    console.log('')
    console.log('🔗 URL base per i file:')
    console.log(`   https://storage.googleapis.com/${bucketName}/`)

  } catch (error: any) {
    console.error('')
    console.error('❌ Errore durante la configurazione:', error.message)
    console.error('')
    
    if (error.code === 403) {
      console.error('💡 Il service account non ha i permessi necessari.')
      console.error('   Assicurati che abbia uno di questi ruoli:')
      console.error('   - Storage Admin')
      console.error('   - Storage Object Admin + Storage Legacy Bucket Owner')
    } else if (error.code === 412) {
      console.error('💡 Configurazione tramite API non consentita.')
      console.error('   Devi configurare manualmente dalla console web.')
    }
    
    console.error('')
    console.error('📋 Configurazione manuale:')
    console.error('   https://console.cloud.google.com/storage/browser/' + bucketName)
  }
}

setupBucket()
