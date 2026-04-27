import sharp from 'sharp'
import https from 'https'
import http from 'http'

async function readImageMetadata(url: string) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http

    protocol.get(url, (response) => {
      const chunks: Buffer[] = []
      let totalBytes = 0

      response.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
        totalBytes += chunk.length

        // Limita a 10MB per evitare di scaricare immagini troppo grandi
        if (totalBytes > 10 * 1024 * 1024) {
          response.destroy()
          reject(new Error('Immagine troppo grande (>10MB)'))
          return
        }
      })

      response.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks)
          const metadata = await sharp(buffer).metadata()
          resolve(metadata)
        } catch (error) {
          reject(error)
        }
      })

      response.on('error', reject)
    }).on('error', reject)
  })
}

// Esempio di utilizzo
async function main() {
  const imageUrl = process.argv[2]

  if (!imageUrl) {
    console.log('Uso: npx tsx scripts/read-image-metadata.ts <image-url>')
    process.exit(1)
  }

  try {
    console.log(`🔍 Leggendo metadati da: ${imageUrl}`)
    const metadata = await readImageMetadata(imageUrl)
    console.log('📊 Metadati estratti:')
    console.log(JSON.stringify(metadata, null, 2))
  } catch (error) {
    console.error('❌ Errore:', error)
  }
}

if (require.main === module) {
  main()
}

export { readImageMetadata }