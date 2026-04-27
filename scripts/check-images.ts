import { prisma } from '@/lib/prisma'

async function checkDocuments() {
  const documents = await prisma.document.findMany({
    include: {
      images: true
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  console.log('📄 Ultimi 10 documenti:')
  documents.forEach(doc => {
    console.log(`\n${doc.title}`)
    console.log(`  ID: ${doc.id}`)
    console.log(`  Thumbnail: ${doc.thumbnail ? '✅' : '❌'}`)
    console.log(`  Immagini nel DB: ${doc.images.length}`)
    if (doc.images.length > 0) {
      doc.images.forEach(img => {
        console.log(`    - ${img.url}`)
      })
    }
  })
}

checkDocuments()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
