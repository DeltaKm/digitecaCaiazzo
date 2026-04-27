import { prisma } from '../lib/prisma'
import https from 'https'
import http from 'http'

// Funzione per ottenere dimensioni da URL remoto
function getImageDimensionsFromUrl(url: string): Promise<{width: number, height: number}> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    
    protocol.get(url, (response) => {
      const chunks: Buffer[] = []
      let bytesRead = 0
      const maxBytes = 50000 // Leggi solo i primi 50KB per trovare dimensioni
      
      response.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
        bytesRead += chunk.length
        
        // Prova a leggere le dimensioni dai primi bytes
        if (bytesRead >= maxBytes) {
          response.destroy()
        }
      })
      
      response.on('end', () => {
        const buffer = Buffer.concat(chunks)
        
        // Detect JPEG
        if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
          let offset = 2
          while (offset < buffer.length) {
            if (buffer[offset] !== 0xFF) break
            
            const marker = buffer[offset + 1]
            if (marker === 0xC0 || marker === 0xC2) {
              const height = buffer.readUInt16BE(offset + 5)
              const width = buffer.readUInt16BE(offset + 7)
              return resolve({ width, height })
            }
            
            offset += 2 + buffer.readUInt16BE(offset + 2)
          }
        }
        
        // Detect PNG
        if (buffer.toString('ascii', 1, 4) === 'PNG') {
          const width = buffer.readUInt32BE(16)
          const height = buffer.readUInt32BE(20)
          return resolve({ width, height })
        }
        
        reject(new Error('Formato immagine non supportato o dati insufficienti'))
      })
      
      response.on('error', reject)
    }).on('error', reject)
  })
}

async function fixImageDimensions() {
  console.log('🔍 Cercando immagini con dimensioni 0x0...\n')
  
  const images = await prisma.image.findMany({
    where: {
      OR: [
        { width: 0 },
        { height: 0 }
      ]
    },
    include: {
      document: {
        select: { title: true }
      }
    }
  })
  
  console.log(`📊 Trovate ${images.length} immagini da fixare\n`)
  
  for (const img of images) {
    console.log(`📄 ${img.document.title}`)
    console.log(`   URL: ${img.url}`)
    console.log(`   Dimensioni attuali: ${img.width}x${img.height}`)
    
    try {
      const dimensions = await getImageDimensionsFromUrl(img.url)
      console.log(`   ✅ Nuove dimensioni: ${dimensions.width}x${dimensions.height}`)
      
      await prisma.image.update({
        where: { id: img.id },
        data: {
          width: dimensions.width,
          height: dimensions.height
        }
      })
      
      console.log(`   💾 Aggiornata!\n`)
    } catch (error) {
      console.error(`   ❌ Errore:`, error)
      console.log()
    }
  }
  
  console.log('✅ Completato!')
}

fixImageDimensions()
  .catch(console.error)
  .finally(() => process.exit())
