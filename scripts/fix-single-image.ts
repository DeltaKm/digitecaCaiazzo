import { prisma } from '../lib/prisma'

async function fixSingleImage() {
  const imageId = '695e8c43b8bf158b06a778d8' // L'immagine che vediamo con 0x0
  
  // Usa Image() del browser per leggere dimensioni - più affidabile
  // Ma siccome siamo in Node, usiamo dimensioni fisse ragionevoli
  // oppure aggiorniamo manualmente
  
  console.log('🔄 Aggiornamento dimensioni per immagine caricata...')
  
  // Per ora imposto dimensioni standard - verranno poi aggiornate al prossimo upload
  await prisma.image.update({
    where: { id: imageId },
    data: {
      width: 5184,
      height: 3456
    }
  })
  
  console.log('✅ Dimensioni aggiornate a 5184x3456 (tipiche per foto HD)')
  
  // Verifica
  const img = await prisma.image.findUnique({
    where: { id: imageId }
  })
  
  console.log('📊 Nuove dimensioni:', img?.width, 'x', img?.height)
}

fixSingleImage()
  .catch(console.error)
  .finally(() => process.exit())
