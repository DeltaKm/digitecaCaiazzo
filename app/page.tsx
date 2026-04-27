import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import HomeClient from "@/components/HomeClient"
import { ThemeToggle } from "@/components/ThemeToggle"
import { auth } from "@/auth"
import { User } from "lucide-react"

export default async function Home() {
  // Controlla se l'utente è loggato
  const session = await auth()
  
  // Recupera tutti i documenti pubblicati
  let documents: any[] = []
  let categories: any[] = []
  let error: string | null = null

  try {
    // Carica categorie dal database
    categories = await prisma.category.findMany({
      orderBy: { order: 'asc' }
    })
    
    documents = await prisma.document.findMany({
      where: { published: true },
      include: {
        images: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Serializza le date per il client
    documents = documents.map(doc => ({
      ...doc,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      images: doc.images.map((img: any) => ({
        ...img,
        createdAt: img.createdAt.toISOString(),
        transcription: img.transcription || null,
        keywords: img.keywords || null,
        notes: img.notes || null
      }))
    }))
    
    console.log(`Found ${documents.length} published documents`)
  } catch (err) {
    console.error('Error fetching documents:', err)
    error = err instanceof Error ? err.message : 'Unknown error'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-4">
            <Image src="/logo.jpg" alt="Digiteca Logo" width={450} height={150} className="h-20 w-auto" priority />
            <span className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Città di Caiazzo</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {session?.user ? (
              <div className="flex items-center gap-3">
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">{session.user.name || session.user.email}</span>
                </Link>
              </div>
            ) : (
              <Link href="/auth/signin" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Title Section */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-gray-100">Digiteca</h1>
          <p className="text-gray-600 dark:text-gray-400">Cerca e scopri le collezioni</p>
        </div>

        {/* Mostra errore se presente */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-200">
            <p className="font-semibold">Errore nel caricamento dei documenti:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Mostra messaggio se non ci sono documenti */}
        {!error && documents.length === 0 && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-8 text-center">
            <svg className="mx-auto mb-4 h-16 w-16 text-blue-400 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Nessun documento disponibile</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Al momento non ci sono documenti pubblicati nell'archivio.</p>
            <Link href="/auth/signin" className="inline-block px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600">
              Accedi per caricare documenti
            </Link>
          </div>
        )}

        {/* Client Component con filtri e ricerca */}
        {documents.length > 0 && <HomeClient documents={documents} categories={categories} />}
      </main>
    </div>
  )
}


