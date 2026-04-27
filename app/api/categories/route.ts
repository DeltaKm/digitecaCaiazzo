import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { bucket, moveFile } from "@/lib/storage"
import { revalidatePath } from "next/cache"

/**
 * Pulisce il nome per il DB e per GCS
 * Converte in lowercase, spazi in dash, rimuove caratteri speciali
 */
function cleanName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

/**
 * Rinomina una cartella in GCS spostando tutti i file
 */
async function renameGCSFolder(oldName: string, newName: string, isSubcategory: boolean) {
  try {
    const cleanOldName = cleanName(oldName)
    const cleanNewName = cleanName(newName)

    if (cleanOldName === cleanNewName) return 0

    const [files] = await bucket.getFiles()
    let renamedCount = 0

    for (const file of files) {
      const parts = file.name.split('/')
      let shouldRename = false
      let newPath = ''

      if (isSubcategory && parts[1] === cleanOldName) {
        // È una sottocategoria: sostituisce il secondo livello
        parts[1] = cleanNewName
        newPath = parts.join('/')
        shouldRename = true
      } else if (!isSubcategory && parts[0] === cleanOldName) {
        // È una categoria: sostituisce il primo livello
        parts[0] = cleanNewName
        newPath = parts.join('/')
        shouldRename = true
      }

      if (shouldRename) {
        try {
          // Usa la funzione moveFile che fa copy + delete
          await moveFile(file.name, newPath)
          renamedCount++
          console.log(`✅ Rinominato: ${file.name} → ${newPath}`)
        } catch (error) {
          console.error(`❌ Errore rinominazione: ${file.name}`, error)
        }
      }
    }

    return renamedCount
  } catch (error) {
    console.error("❌ Errore durante rinominazione folder GCS:", error)
    throw error
  }
}

/**
 * Aggiorna gli URL nel database dopo la rinomina delle cartelle GCS
 */
async function updateImageUrlsInDB(oldName: string, newName: string, isSubcategory: boolean) {
  try {
    const cleanOldName = cleanName(oldName)
    const cleanNewName = cleanName(newName)

    if (cleanOldName === cleanNewName) return 0

    // Pattern da cercare nell'URL in base al tipo
    let searchPattern: string
    let replacePattern: string

    if (isSubcategory) {
      // Per sottocategorie: cerca il pattern nel secondo livello del path
      // Es: /categoria/sottocategoria/ 
      searchPattern = `/${cleanOldName}/`
      replacePattern = `/${cleanNewName}/`
    } else {
      // Per categorie: cerca il pattern all'inizio del path dopo il bucket
      // Es: /categoria/
      // Dobbiamo cercare gli URL che contengono questo pattern all'inizio del path
      searchPattern = `/${cleanOldName}/`
      replacePattern = `/${cleanNewName}/`
    }

    // Trova le immagini che contengono il vecchio path
    const images = await prisma.image.findMany({
      where: {
        url: { contains: searchPattern }
      }
    })

    console.log(`🔍 Trovate ${images.length} immagini da aggiornare`)

    let updatedCount = 0
    for (const image of images) {
      const oldUrl = image.url
      
      // Sostituisci tutte le occorrenze del vecchio path con il nuovo
      const newUrl = oldUrl.replace(new RegExp(searchPattern, 'g'), replacePattern)
      
      if (newUrl !== oldUrl) {
        try {
          await prisma.image.update({
            where: { id: image.id },
            data: { url: newUrl }
          })
          updatedCount++
          console.log(`✅ URL aggiornato: ${oldUrl} → ${newUrl}`)
        } catch (updateError) {
          console.error(`❌ Errore update immagine ${image.id}:`, updateError)
        }
      }
    }

    console.log(`✅ Totale ${updatedCount}/${images.length} URL aggiornati nel DB`)
    return updatedCount
  } catch (error) {
    console.error("❌ Errore durante aggiornamento URL nel DB:", error)
    throw error
  }
}

/**
 * Elimina una cartella in GCS con tutti i file dentro
 */
async function deleteGCSFolder(folderName: string, isSubcategory: boolean) {
  try {
    const cleanName_ = cleanName(folderName)
    const [files] = await bucket.getFiles()
    let deletedCount = 0

    for (const file of files) {
      const parts = file.name.split('/')
      let shouldDelete = false

      if (isSubcategory && parts[1] === cleanName_) {
        shouldDelete = true
      } else if (!isSubcategory && parts[0] === cleanName_) {
        shouldDelete = true
      }

      if (shouldDelete) {
        try {
          await file.delete()
          deletedCount++
          console.log(`✅ Eliminato: ${file.name}`)
        } catch (error) {
          console.error(`❌ Errore eliminazione: ${file.name}`, error)
        }
      }
    }

    return deletedCount
  } catch (error) {
    console.error("❌ Errore durante eliminazione folder GCS:", error)
    throw error
  }
}

// Disabilita il caching per questa route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET: Restituisce tutte le categorie dal database
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' }
    })

    console.log(`📥 GET: Ritornando ${categories.length} categorie dal DB`)
    categories.forEach(cat => {
      console.log(`  - ${cat.categoryId}: "${cat.name}"`)
    })

    // Ritorna le categorie con categoryId invece di id
    const formattedCategories = categories.map(cat => ({
      categoryId: cat.categoryId,
      name: cat.name,
      subcategories: cat.subcategories
    }))

    return NextResponse.json(formattedCategories)
  } catch (error) {
    console.error("Errore lettura categorie:", error)
    return NextResponse.json({ error: "Errore durante la lettura delle categorie" }, { status: 500 })
  }
}

/**
 * POST: Crea una nuova categoria o aggiunge una sottocategoria
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 })
    }

    const body = await request.json()
    const { categoryId, name, subcategory } = body

    // Se è una sottocategoria
    if (subcategory) {
      const category = await prisma.category.findUnique({
        where: { categoryId }
      })

      if (!category) {
        return NextResponse.json({ error: "Categoria non trovata" }, { status: 404 })
      }

      if (category.subcategories.includes(subcategory)) {
        return NextResponse.json({ error: "Sottocategoria già esistente" }, { status: 400 })
      }

      // Aggiungi la sottocategoria al DB
      const updatedCategory = await prisma.category.update({
        where: { categoryId },
        data: {
          subcategories: [...category.subcategories, subcategory]
        }
      })

      return NextResponse.json({
        success: true,
        message: `Sottocategoria "${subcategory}" aggiunta`,
        category: updatedCategory
      })
    }

    // Se è una nuova categoria
    const existingCategory = await prisma.category.findUnique({
      where: { categoryId }
    })

    if (existingCategory) {
      return NextResponse.json({ error: "Categoria già esistente" }, { status: 400 })
    }

    // Ottieni l'ordine massimo
    const maxOrder = await prisma.category.findFirst({
      orderBy: { order: 'desc' }
    })

    const newCategory = await prisma.category.create({
      data: {
        categoryId,
        name: name || categoryId,
        subcategories: [],
        order: (maxOrder?.order || 0) + 1
      }
    })

    return NextResponse.json({
      success: true,
      message: `Categoria "${name}" creata`,
      category: newCategory
    })
  } catch (error) {
    console.error("❌ Errore creazione categoria:", error)
    return NextResponse.json(
      { error: "Errore durante la creazione della categoria", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    )
  }
}

/**
 * PATCH: Modifica una categoria o sottocategoria
 */
export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: "Accesso negato" }, { status: 403 })
    }

    const body = await request.json()
    const { categoryId, action, newName, subcategoryName } = body

    const category = await prisma.category.findUnique({
      where: { categoryId }
    })

    if (!category) {
      return NextResponse.json({ error: "Categoria non trovata" }, { status: 404 })
    }

    // ========== RINOMINA CATEGORIA ==========
    if (action === 'rename') {
      console.log(`🔄 RINOMINA CATEGORIA: "${category.name}" → "${newName}" (ID: "${categoryId}")`)
      
      if (!newName || !newName.trim()) {
        return NextResponse.json({ error: "Nuovo nome non valido" }, { status: 400 })
      }

      const trimmedNewName = newName.trim()
      if (trimmedNewName === category.name) {
        // Se il nome non è cambiato, non fare nulla ma non è un errore
        return NextResponse.json({
          success: true,
          message: `Nome non modificato`,
          category
        })
      }

      console.log(`🔄 PRIMA: Categoria "${categoryId}" ha nome: "${category.name}"`)

      // 1. Rinomina in GCS (tutti i file della categoria)
      console.log(`📁 Rinomino cartella GCS da "${category.name}" a "${trimmedNewName}"...`)
      const filesRenamed = await renameGCSFolder(category.name, trimmedNewName, false)
      console.log(`✅ ${filesRenamed} file rinominati su GCS`)

      // 2. Aggiorna gli URL nel database
      console.log(`🔍 Aggiorno URL nel database...`)
      const urlsUpdated = await updateImageUrlsInDB(category.name, trimmedNewName, false)
      console.log(`✅ ${urlsUpdated} URL aggiornati nel database`)

      // 3. Aggiorna nel DB la categoria
      const updatedCategory = await prisma.category.update({
        where: { categoryId },
        data: { name: trimmedNewName }
      })

      // ℹ️ NOTA: Non serve aggiornare i documenti perché salvano il categoryId, non il nome
      console.log(`✅ DOPO UPDATE: Categoria "${categoryId}" ha nome: "${updatedCategory.name}"`)
      
      // 🔍 Verifica documenti con questa categoria (per debug)
      const docsCount = await prisma.document.count({
        where: { category: categoryId }
      })
      console.log(`ℹ️ Trovati ${docsCount} documenti con category="${categoryId}" (usano ID, non nome)`)

      // Verifica che sia stato salvato davvero
      const verified = await prisma.category.findUnique({
        where: { categoryId }
      })
      console.log(`✅ VERIFICA: Categoria "${categoryId}" ha nome nel DB: "${verified?.name}"`)

      // Invalida la cache della home page
      revalidatePath('/')
      revalidatePath('/dashboard')

      return NextResponse.json({
        success: true,
        message: `Categoria rinominata in "${trimmedNewName}" (${filesRenamed} file GCS, ${urlsUpdated} URL DB aggiornati)`,
        category: updatedCategory
      })
    }

    // ========== RINOMINA SOTTOCATEGORIA ==========
    if (action === 'rename_subcategory') {
      console.log(`🔄 RINOMINA SOTTOCATEGORIA: "${subcategoryName}" → "${newName}" nella categoria "${categoryId}"`)
      
      if (!subcategoryName || !newName || !newName.trim()) {
        return NextResponse.json({ error: "Parametri non validi" }, { status: 400 })
      }

      if (!category.subcategories.includes(subcategoryName)) {
        return NextResponse.json({ error: "Sottocategoria non trovata" }, { status: 404 })
      }

      const trimmedNewName = newName.trim()
      if (trimmedNewName === subcategoryName) {
        return NextResponse.json({
          success: true,
          message: `Nome non modificato`,
          category
        })
      }

      // 1. Rinomina in GCS (tutti i file della sottocategoria)
      const filesRenamed = await renameGCSFolder(subcategoryName, trimmedNewName, true)
      console.log(`✅ ${filesRenamed} file rinominati su GCS`)

      // 2. Aggiorna gli URL nel database
      const urlsUpdated = await updateImageUrlsInDB(subcategoryName, trimmedNewName, true)
      console.log(`✅ ${urlsUpdated} URL aggiornati nel database`)

      // 3. Aggiorna nel DB l'array delle sottocategorie
      const updatedSubcategories = category.subcategories.map(sub =>
        sub === subcategoryName ? trimmedNewName : sub
      )

      const updatedCategory = await prisma.category.update({
        where: { categoryId },
        data: { subcategories: updatedSubcategories }
      })

      // 4. 🔥 IMPORTANTE: Aggiorna anche tutti i documenti che usano questa sottocategoria
      console.log(`🔍 Cerco documenti con category="${categoryId}" e subcategory="${subcategoryName}"`)
      
      const documentsUpdated = await prisma.document.updateMany({
        where: { 
          category: categoryId,
          subcategory: subcategoryName 
        },
        data: { subcategory: trimmedNewName }
      })
      console.log(`✅ Aggiornati ${documentsUpdated.count} documenti con sottocategoria "${subcategoryName}" → "${trimmedNewName}"`)

      // Invalida la cache della home page
      revalidatePath('/')
      revalidatePath('/dashboard')

      return NextResponse.json({
        success: true,
        message: `Sottocategoria rinominata in "${trimmedNewName}" (${filesRenamed} file GCS, ${urlsUpdated} URL DB, ${documentsUpdated.count} documenti aggiornati)`,
        category: updatedCategory
      })
    }

    // ========== ELIMINA CATEGORIA ==========
    if (action === 'delete') {
      // Elimina in GCS (tutti i file della categoria)
      const filesDeleted = await deleteGCSFolder(category.name, false)

      // Elimina dal DB
      await prisma.category.delete({
        where: { categoryId }
      })

      return NextResponse.json({
        success: true,
        message: `Categoria eliminata (${filesDeleted} file eliminati)`,
        filesDeleted
      })
    }

    // ========== ELIMINA SOTTOCATEGORIA ==========
    if (action === 'delete_subcategory') {
      if (!subcategoryName) {
        return NextResponse.json({ error: "Nome sottocategoria mancante" }, { status: 400 })
      }

      if (!category.subcategories.includes(subcategoryName)) {
        return NextResponse.json({ error: "Sottocategoria non trovata" }, { status: 404 })
      }

      // Elimina in GCS (tutti i file della sottocategoria)
      const filesDeleted = await deleteGCSFolder(subcategoryName, true)

      // Aggiorna nel DB
      const updatedSubcategories = category.subcategories.filter(sub => sub !== subcategoryName)

      const updatedCategory = await prisma.category.update({
        where: { categoryId },
        data: { subcategories: updatedSubcategories }
      })

      return NextResponse.json({
        success: true,
        message: `Sottocategoria eliminata (${filesDeleted} file eliminati)`,
        category: updatedCategory
      })
    }

    return NextResponse.json({ error: "Azione non supportata" }, { status: 400 })
  } catch (error) {
    console.error("❌ Errore aggiornamento categoria:", error)
    return NextResponse.json(
      { error: "Errore durante l'aggiornamento della categoria", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    )
  }
}
