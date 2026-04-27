import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Trova l'utente admin
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' }
  })

  if (!admin) {
    console.error('❌ Nessun admin trovato. Esegui prima: npx tsx scripts/create-admin.ts')
    return
  }

  // Documenti di esempio per ogni categoria
  const sampleDocuments = [
    {
      title: "Atto notarile 1703",
      description: "Documento notarile del XVIII secolo",
      category: "archivi",
      subcategory: "notarili",
      period: "1703",
      identifier: "DGT-ARCH-001",
      thumbnail: "https://placehold.co/400x300/e3f2fd/1976d2?text=Atto+Notarile",
      manifestUrl: "https://example.com/iiif/manifest-1.json"
    },
    {
      title: "Intervista storica - Giovanni Rossi",
      description: "Intervista sulla vita nel dopoguerra",
      category: "audio",
      subcategory: "interviste",
      period: "1945-1950",
      identifier: "DGT-AUD-001",
      thumbnail: "https://placehold.co/400x300/f3e5f5/7b1fa2?text=Intervista",
      manifestUrl: "https://example.com/iiif/manifest-2.json"
    },
    {
      title: "Manoscritto medievale",
      description: "Manoscritto illuminato del XV secolo",
      category: "biblioteca",
      subcategory: "manoscritti",
      period: "1450",
      identifier: "DGT-BIB-001",
      thumbnail: "https://placehold.co/400x300/e8f5e9/388e3c?text=Manoscritto",
      manifestUrl: "https://example.com/iiif/manifest-3.json"
    },
    {
      title: "Ritratto di famiglia",
      description: "Fotografia storica di famiglia del 1920",
      category: "immagini",
      subcategory: "ritratti",
      period: "1920",
      identifier: "DGT-IMG-001",
      thumbnail: "https://placehold.co/400x300/fff3e0/f57c00?text=Ritratto",
      manifestUrl: "https://example.com/iiif/manifest-4.json"
    },
    {
      title: "Utensile agricolo tradizionale",
      description: "Aratro del XIX secolo",
      category: "kere",
      subcategory: "utensili",
      period: "1850",
      identifier: "DGT-KER-001",
      thumbnail: "https://placehold.co/400x300/fce4ec/c2185b?text=Utensile",
      manifestUrl: "https://example.com/iiif/manifest-5.json"
    },
    {
      title: "Pannello didattico - Storia locale",
      description: "Materiale educativo sulla storia del territorio",
      category: "materiali",
      subcategory: "didattici",
      period: "2020",
      identifier: "DGT-MAT-001",
      thumbnail: "https://placehold.co/400x300/e0f2f1/00796b?text=Pannello",
      manifestUrl: "https://example.com/iiif/manifest-6.json"
    },
    {
      title: "Albero genealogico famiglia Bianchi",
      description: "Genealogia documentata dal 1600",
      category: "radici",
      subcategory: "genealogie",
      period: "1600-2000",
      identifier: "DGT-RAD-001",
      thumbnail: "https://placehold.co/400x300/f1f8e9/689f38?text=Genealogia",
      manifestUrl: "https://example.com/iiif/manifest-7.json"
    },
    {
      title: "Regesto documenti notarili",
      description: "Elenco sintetico degli atti notarili",
      category: "regesti",
      subcategory: "regesti",
      period: "1700-1800",
      identifier: "DGT-REG-001",
      thumbnail: "https://placehold.co/400x300/ede7f6/512da8?text=Regesto",
      manifestUrl: "https://example.com/iiif/manifest-8.json"
    },
    {
      title: "Documentario sulla tradizione",
      description: "Video documentario sulle tradizioni locali",
      category: "video",
      subcategory: "documentari",
      period: "2019",
      identifier: "DGT-VID-001",
      thumbnail: "https://placehold.co/400x300/e1f5fe/0277bd?text=Documentario",
      manifestUrl: "https://example.com/iiif/manifest-9.json"
    }
  ]

  console.log('📦 Creazione documenti di esempio...\n')

  for (const doc of sampleDocuments) {
    try {
      await prisma.document.create({
        data: {
          ...doc,
          userId: admin.id,
          images: {
            create: [
              {
                url: doc.thumbnail,
                width: 4000,
                height: 3000,
                format: 'jpg',
                order: 0
              }
            ]
          }
        }
      })
      console.log(`✅ ${doc.title} (${doc.category}/${doc.subcategory})`)
    } catch (error: any) {
      console.log(`⚠️  ${doc.title} - ${error.message}`)
    }
  }

  console.log('\n🎉 Documenti di esempio creati con successo!')
  console.log('\n📊 Categorie popolate:')
  console.log('   • Archivi (notarili)')
  console.log('   • Audio (interviste)')
  console.log('   • Biblioteca (manoscritti)')
  console.log('   • Immagini (ritratti)')
  console.log('   • Kere (utensili)')
  console.log('   • Materiali (didattici)')
  console.log('   • Radici (genealogie)')
  console.log('   • Regesti (regesti)')
  console.log('   • Video (documentari)')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
