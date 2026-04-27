import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import SearchClient from "@/components/SearchClient"
import AdminLayout from "@/components/AdminLayout"

export default async function AdminSearchPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! }
  })

  if (user?.role !== 'admin') {
    redirect("/")
  }

  // Carica categorie dal database
  const categories = await prisma.category.findMany({
    orderBy: { order: 'asc' }
  })

  const documents = await prisma.document.findMany({
    include: {
      images: true,
      user: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Serializza per il client
  const serializedDocuments = documents.map(doc => ({
    ...doc,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    images: doc.images.map(img => ({
      ...img,
      createdAt: img.createdAt.toISOString(),
      transcription: img.transcription || null,
      keywords: img.keywords || null,
      notes: img.notes || null
    }))
  }))

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ricerca Avanzata</h1>
          <p className="text-sm text-gray-600">Cerca e filtra documenti con criteri avanzati</p>
        </div>

        <SearchClient documents={serializedDocuments} categories={categories} />
      </div>
    </AdminLayout>
  )
}
