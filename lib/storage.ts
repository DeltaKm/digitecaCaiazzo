import { Storage } from '@google-cloud/storage'

// Inizializza il client Google Cloud Storage
// Supporta sia file locale (sviluppo) che variabile d'ambiente (Vercel)
const storage = new Storage(
  process.env.GCS_SERVICE_ACCOUNT_KEY
    ? {
        projectId: process.env.GCS_PROJECT_ID,
        credentials: JSON.parse(process.env.GCS_SERVICE_ACCOUNT_KEY),
      }
    : {
        projectId: process.env.GCS_PROJECT_ID,
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || undefined,
      }
)

const bucket = storage.bucket(process.env.GCS_BUCKET || 'digiteca-objects')

/**
 * Genera il path organizzato per il file su GCS
 * Struttura: categoria/sottocategoria/periodo/anno/mese/stato/filename
 * 
 * Esempio: immagini/fotografie/epoca-moderna/2024/01/pubblicato/doc123_image.jpg
 */
export function generateStoragePath(metadata: {
  category: string
  subcategory: string
  period?: string | null
  status?: string
  createdAt: Date
  filename: string
}): string {
  const year = metadata.createdAt.getFullYear()
  const month = String(metadata.createdAt.getMonth() + 1).padStart(2, '0')
  const status = metadata.status || 'bozza'
  const period = metadata.period || 'non-specificato'

  // Pulisce i nomi per evitare caratteri non validi nei path
  const cleanCategory = metadata.category.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const cleanSubcategory = metadata.subcategory.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const cleanPeriod = period.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const cleanStatus = status.toLowerCase().replace(/[^a-z0-9-]/g, '-')

  return `${cleanCategory}/${cleanSubcategory}/${cleanPeriod}/${year}/${month}/${cleanStatus}/${metadata.filename}`
}

/**
 * Genera un Signed URL per l'upload diretto dal client a GCS
 * Questo bypassa i limiti di Vercel permettendo upload di file di qualsiasi dimensione
 */
export async function generateSignedUploadUrl(
  path: string,
  contentType: string = 'application/octet-stream'
): Promise<{ signedUrl: string; publicUrl: string }> {
  const blob = bucket.file(path)
  
  // Genera URL firmato valido per 15 minuti
  const [signedUrl] = await blob.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minuti
    contentType,
  })

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`
  
  return { signedUrl, publicUrl }
}

/**
 * Rende pubblico un file su GCS dopo l'upload
 */
export async function makeFilePublic(path: string): Promise<void> {
  const blob = bucket.file(path)
  
  try {
    await blob.makePublic()
  } catch (error) {
    console.log('Nota: impossibile rendere pubblico il file (Public Access Prevention attivo)')
  }
}

/**
 * Upload di un file su Google Cloud Storage (per compatibilità con codice esistente)
 */
export async function uploadFile(
  file: Buffer,
  path: string,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  const blob = bucket.file(path)
  
  await blob.save(file, {
    contentType,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  })

  // Prova a rendere pubblico il file
  try {
    await blob.makePublic()
  } catch (error) {
    console.log('Nota: impossibile rendere pubblico il file (Public Access Prevention attivo)')
  }

  // Ritorna l'URL pubblico
  return `https://storage.googleapis.com/${bucket.name}/${path}`
}

/**
 * Elimina un file da Google Cloud Storage
 */
export async function deleteFile(path: string): Promise<void> {
  const blob = bucket.file(path)
  await blob.delete()
}

/**
 * Lista i file in una determinata cartella
 */
export async function listFiles(prefix: string): Promise<string[]> {
  const [files] = await bucket.getFiles({ prefix })
  return files.map(file => file.name)
}

/**
 * Ottiene l'URL pubblico di un file
 */
export function getPublicUrl(path: string): string {
  return `https://storage.googleapis.com/${bucket.name}/${path}`
}

/**
 * Sposta un file da una posizione all'altra (utile quando cambia lo stato)
 */
export async function moveFile(oldPath: string, newPath: string): Promise<string> {
  const oldBlob = bucket.file(oldPath)
  const newBlob = bucket.file(newPath)

  await oldBlob.copy(newBlob)
  await oldBlob.delete()
  
  // Prova a rendere pubblico il nuovo file
  try {
    await newBlob.makePublic()
  } catch (error) {
    // Ignora l'errore se Public Access Prevention è attivo
  }

  return getPublicUrl(newPath)
}

/**
 * Lista i file filtrati per parametri specifici
 * Utile per queries veloci basate sulla struttura delle cartelle
 */
export async function listFilesByFilter(filters: {
  category?: string
  subcategory?: string
  period?: string
  year?: number
  month?: number
  status?: string
}): Promise<string[]> {
  let prefix = ''

  if (filters.category) {
    prefix += `${filters.category.toLowerCase().replace(/[^a-z0-9-]/g, '-')}/`
    
    if (filters.subcategory) {
      prefix += `${filters.subcategory.toLowerCase().replace(/[^a-z0-9-]/g, '-')}/`
      
      if (filters.period) {
        prefix += `${filters.period.toLowerCase().replace(/[^a-z0-9-]/g, '-')}/`
        
        if (filters.year) {
          prefix += `${filters.year}/`
          
          if (filters.month) {
            prefix += `${String(filters.month).padStart(2, '0')}/`
            
            if (filters.status) {
              prefix += `${filters.status.toLowerCase().replace(/[^a-z0-9-]/g, '-')}/`
            }
          }
        }
      }
    }
  }

  return listFiles(prefix)
}

export { bucket, storage }
