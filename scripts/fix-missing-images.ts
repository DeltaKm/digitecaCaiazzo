import { prisma } from '@/lib/prisma'

async function fixImages() {
  // Trova documenti con thumbnail ma senza immagini
  const documents = await prisma.document.findMany({
    where: {
      thumbnail: { not: '' },
      images: { none: {} }
    },
    include: { images: true }
  })

  console.log(`📄 Trovati ${documents.length} documenti con thumbnail ma senza immagini`)

  for (const doc of documents) {
    console.log(`\n🔧 Fixing: ${doc.title}`)
    console.log(`   Thumbnail: ${doc.thumbnail}`)
    
    try {
      // Crea l'immagine dal thumbnail
      const image = await prisma.image.create({
        data: {
          documentId: doc.id,
          url: doc.thumbnail,
          width: 0,
          height: 0,
          format: doc.thumbnail.split('.').pop() || 'jpg',
          order: 0
        }
      })
      
      console.log(`   ✅ Immagine creata: ${image.id}`)
    } catch (err) {
      console.error(`   ❌ Errore:`, err)
    }
  }

  console.log('\n✅ Processo completato!')
}

fixImages()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
