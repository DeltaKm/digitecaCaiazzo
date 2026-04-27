import { prisma } from "../lib/prisma"

async function checkTypes() {
  try {
    const types = await prisma.documentType.findMany()
    console.log('📋 Tipi nel database:', types.length)
    types.forEach((type: any) => {
      console.log(`  - ${type.name} (${type.typeId})`)
    })
  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTypes()
