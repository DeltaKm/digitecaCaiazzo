import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AdminLayout from "@/components/AdminLayout"
import ManifestManagerClient from "@/components/ManifestManagerClient"

export default async function AdminManifestPage() {
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

  const documents = await prisma.document.findMany({
    include: {
      images: {
        orderBy: { order: 'asc' }
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
      createdAt: img.createdAt.toISOString()
    }))
  }))

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manifest IIIF</h1>
          <p className="text-sm text-gray-600">
            Gestisci i manifest IIIF e le immagini dei documenti con trascrizioni e parole chiave
          </p>
        </div>

        <ManifestManagerClient documents={serializedDocuments} />
      </div>
    </AdminLayout>
  )
}
