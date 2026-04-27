// Script per migrare le categorie dal file categories.ts al database
import { PrismaClient } from '@prisma/client'
import { CATEGORIES } from '../lib/categories'

const prisma = new PrismaClient()

async function migrateCategories() {
  console.log('🔄 Inizio migrazione categorie...')

  try {
    // Conta le categorie esistenti
    const existingCount = await prisma.category.count()
    
    if (existingCount > 0) {
      console.log(`ℹ️  Trovate ${existingCount} categorie già esistenti nel database`)
      console.log('⏭️  Migrazione saltata (categorie già presenti)')
      return
    }

    // Inserisci le categorie dal file
    let order = 0
    for (const category of CATEGORIES) {
      const created = await prisma.category.create({
        data: {
          categoryId: category.id,
          name: category.name,
          subcategories: category.subcategories,
          order: order++
        }
      })
      console.log(`✅ Migrata categoria: ${created.categoryId} - ${created.name}`)
    }

    console.log('✅ Migrazione completata con successo!')
    console.log(`📊 Totale categorie migrate: ${CATEGORIES.length}`)
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateCategories()
