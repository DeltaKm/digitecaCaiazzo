import { prisma } from '../lib/prisma'

async function checkDocumentCopyright() {
  const documentId = '698e18d1441b9fa7818ceb9f'
  
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      title: true,
      author: true,
      attribution: true,
      license: true,
      ccType: true,
    }
  })

  if (!document) {
    console.log('❌ Documento non trovato')
    return
  }

  console.log('\n📄 Dati del documento nel database:')
  console.log('─────────────────────────────────────')
  console.log('ID:', document.id)
  console.log('Titolo:', document.title)
  console.log('Autore:', document.author || '(vuoto)')
  console.log('Attribuzione:', document.attribution || '(vuoto)')
  console.log('Licenza:', document.license || '(vuoto)')
  console.log('CC Type:', document.ccType || '(vuoto)')
  console.log('─────────────────────────────────────\n')

  await prisma.$disconnect()
}

checkDocumentCopyright()
