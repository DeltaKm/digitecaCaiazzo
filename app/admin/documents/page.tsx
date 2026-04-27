import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AdminLayout from "@/components/AdminLayout"
import DocumentsHeader from "@/components/DocumentsHeader"
import AdminDocumentsTable from "@/components/AdminDocumentsTable"

export default async function AdminDocumentsPage() {
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
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      category: true,
      subcategory: true,
      period: true,
      identifier: true,
      author: true,
      attribution: true,
      license: true,
      ccType: true,
      location: true,
      century: true,
      materials: true,
      dimensions: true,
      conditions: true,
      provenance: true,
      published: true,
      createdAt: true,
      updatedAt: true,
      images: {
        select: {
          id: true,
          url: true,
          width: true,
          height: true,
          format: true,
          order: true,
          transcription: true,
          keywords: true,
          notes: true,
          createdAt: true
        }
      },
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
    id: doc.id,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    subcategory: doc.subcategory,
    type: doc.type,
    period: doc.period,
    identifier: doc.identifier,
    author: doc.author,
    attribution: doc.attribution,
    license: doc.license,
    ccType: doc.ccType,
    location: doc.location,
    century: doc.century,
    materials: doc.materials,
    dimensions: doc.dimensions,
    conditions: doc.conditions,
    provenance: doc.provenance,
    published: doc.published,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    user: {
      name: doc.user.name,
      email: doc.user.email || ''
    },
    images: doc.images.map(img => ({
      id: img.id,
      url: img.url,
      width: img.width,
      height: img.height,
      format: img.format,
      order: img.order,
      transcription: img.transcription,
      keywords: img.keywords,
      notes: img.notes,
      createdAt: img.createdAt.toISOString()
    }))
  }))

  return (
    <AdminLayout>
      <div className="p-6">
        <DocumentsHeader />
        <AdminDocumentsTable documents={serializedDocuments} />
      </div>
    </AdminLayout>
  )
}
