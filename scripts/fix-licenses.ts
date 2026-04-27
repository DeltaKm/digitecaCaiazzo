import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Aggiornamento licenze...')

  // Trova tutti i documenti con license vuota
  const documents = await prisma.document.findMany({
    where: {
      license: ''
    },
    select: {
      id: true,
      title: true,
      license: true
    }
  })

  console.log(`📋 Trovati ${documents.length} documenti senza licenza`)

  // Aggiorna tutti con il valore di default
  for (const doc of documents) {
    await prisma.document.update({
      where: { id: doc.id },
      data: { license: 'tutti-i-diritti-riservati' }
    })
    console.log(`✅ Aggiornato: ${doc.title}`)
  }

  console.log('✨ Fatto! Tutti i documenti ora hanno una licenza.')
}

main()
  .catch((e) => {
    console.error('❌ Errore:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
