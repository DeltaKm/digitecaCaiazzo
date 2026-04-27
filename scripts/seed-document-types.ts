import { prisma } from "../lib/prisma"

const defaultTypes = [
  { typeId: "documento-testuale", name: "Documento Testuale", order: 0 },
  { typeId: "manoscritto", name: "Manoscritto", order: 1 },
  { typeId: "immagine", name: "Immagine", order: 2 },
  { typeId: "fotografia", name: "Fotografia", order: 3 },
  { typeId: "mappa", name: "Mappa", order: 4 },
  { typeId: "disegno", name: "Disegno", order: 5 },
  { typeId: "stampa", name: "Stampa", order: 6 },
  { typeId: "video", name: "Video", order: 7 },
  { typeId: "audio", name: "Audio", order: 8 },
]

async function seedDocumentTypes() {
  console.log("🌱 Seeding document types...")

  for (const type of defaultTypes) {
    try {
      const existing = await prisma.documentType.findUnique({
        where: { typeId: type.typeId }
      })

      if (existing) {
        console.log(`⏭️  Tipo "${type.name}" già esistente, skip`)
      } else {
        await prisma.documentType.create({
          data: type
        })
        console.log(`✅ Creato tipo: ${type.name}`)
      }
    } catch (error) {
      console.error(`❌ Errore creazione tipo ${type.name}:`, error)
    }
  }

  console.log("✅ Seeding completato!")
}

seedDocumentTypes()
  .catch((e) => {
    console.error("❌ Errore durante il seeding:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
