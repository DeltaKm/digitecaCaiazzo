import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import FilesManagerClient from "@/components/FilesManagerClient"
import AdminLayout from "@/components/AdminLayout"
import Link from "next/link"

export default async function Dashboard() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  // Recupera l'utente dal database
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! }
  })

  const isAdmin = user?.role === 'admin'

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Accesso Negato</h1>
          <p className="text-gray-600 mb-6">Non hai i permessi per accedere a questa pagina.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Torna alla Home
            </Link>
            <Link href="/auth/signin" className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
              Cambia Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Recupera tutti i documenti con le loro immagini
  const documents = await prisma.document.findMany({
    include: {
      images: {
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Recupera le categorie dal database
  const categoriesFromDB = await prisma.category.findMany({
    orderBy: { order: 'asc' }
  })

  // Trasforma nel formato atteso dal componente
  const categories = categoriesFromDB.map(cat => ({
    categoryId: cat.categoryId,
    name: cat.name,
    subcategories: cat.subcategories
  }))

  // Serializza i documenti per il client
  const serializedDocuments = documents.map(doc => ({
    ...doc,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    images: doc.images.map(img => ({
      ...img,
      createdAt: img.createdAt.toISOString()
    }))
  }))

  return (
    <AdminLayout>
      <FilesManagerClient documents={serializedDocuments} categories={categories} />
    </AdminLayout>
  )
}
