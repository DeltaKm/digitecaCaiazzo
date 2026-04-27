import { prisma } from '../lib/prisma'

async function checkDimensions() {
  const doc = await prisma.document.findUnique({
    where: { id: '695e8c3db8bf158b06a778d7' },
    include: { images: true }
  })
  
  console.log('📄 Documento:', doc?.title)
  console.log('🖼️  Immagini:')
  doc?.images.forEach(img => {
    console.log(`  - ${img.url}`)
    console.log(`    Width: ${img.width}, Height: ${img.height}`)
    console.log(`    Format: ${img.format}`)
  })
}

checkDimensions().finally(() => process.exit())
