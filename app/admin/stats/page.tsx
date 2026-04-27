import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { BarChart3, TrendingUp, Users, FileText, Eye } from "lucide-react"
import AdminLayout from "@/components/AdminLayout"

export default async function AdminStatsPage() {
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

  // Statistiche generali
  const totalDocuments = await prisma.document.count()
  const publishedDocuments = await prisma.document.count({ where: { published: true } })
  const totalUsers = await prisma.user.count()
  const totalImages = await prisma.image.count()

  // Documenti per categoria
  const documentsByCategory = await prisma.document.groupBy({
    by: ['category'],
    _count: {
      id: true
    }
  })

  // Documenti recenti
  const recentDocuments = await prisma.document.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  // Serializza per il client
  const serializedRecentDocuments = recentDocuments.map(doc => ({
    ...doc,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  }))

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistiche</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Panoramica generale del sistema</p>
        </div>

        {/* Cards statistiche principali */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Documenti Totali</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalDocuments}</p>
              </div>
              <FileText className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {publishedDocuments} pubblicati
            </p>
          </div>

          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Immagini</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalImages}</p>
              </div>
              <Eye className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Files caricati
            </p>
          </div>

          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Utenti</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalUsers}</p>
              </div>
              <Users className="h-12 w-12 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Utenti registrati
            </p>
          </div>

          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasso Pubblicazione</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {totalDocuments > 0 ? Math.round((publishedDocuments / totalDocuments) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Documenti pubblicati
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Documenti per categoria */}
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <BarChart3 className="h-5 w-5 text-gray-900 dark:text-white" />
              Documenti per Categoria
            </h2>
            <div className="space-y-4">
              {documentsByCategory.map((item) => {
                const total = totalDocuments
                const percentage = total > 0 ? (item._count.id / total) * 100 : 0
                
                return (
                  <div key={item.category}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.category}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item._count.id} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-2 rounded-full bg-blue-600 dark:bg-blue-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              {documentsByCategory.length === 0 && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">Nessun documento presente</p>
              )}
            </div>
          </div>

          {/* Documenti recenti */}
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Documenti Recenti</h2>
            <div className="space-y-3">
              {serializedRecentDocuments.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/viewer/${doc.id}`}
                  className="block rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{doc.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {doc.category} • {doc.subcategory}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Creato da {doc.user.name || doc.user.email}
                      </p>
                    </div>
                    <div className="text-right">
                      {doc.published ? (
                        <span className="inline-block rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs text-green-800 dark:text-green-400">
                          Pubblicato
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 text-xs text-yellow-800 dark:text-yellow-400">
                          Bozza
                        </span>
                      )}
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(doc.createdAt).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                </Link>
                ))}
              {serializedRecentDocuments.length === 0 && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">Nessun documento recente</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}