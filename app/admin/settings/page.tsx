import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Settings as SettingsIcon, User, Database, Globe, Shield } from "lucide-react"
import AdminLayout from "@/components/AdminLayout"
import SettingsClient from "@/components/SettingsClient"
import { getMaintenanceMode } from "@/lib/site-settings"

export default async function AdminSettingsPage() {
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

  const maintenanceMode = await getMaintenanceMode()

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Impostazioni</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Configura il sistema digiteka</p>
        </div>

        <div className="grid gap-6">
          {/* Impostazioni Generali */}
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Globe className="h-5 w-5 text-blue-600" />
              Impostazioni Generali
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome del Sito
                </label>
                <input
                  type="text"
                  defaultValue="digiteka"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descrizione
                </label>
                <textarea
                  defaultValue="Archivio digitale per la conservazione e la consultazione di documenti storici"
                  rows={3}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  URL Base
                </label>
                <input
                  type="url"
                  defaultValue={process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Gestione Categorie e Tipi */}
          <SettingsClient initialMaintenanceMode={maintenanceMode} />

          {/* Impostazioni Storage */}
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Database className="h-5 w-5 text-green-600" />
              Storage e Database
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Google Cloud Storage Bucket
                </label>
                <input
                  type="text"
                  defaultValue="digiteka-objects"
                  disabled
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-gray-500 dark:text-gray-400"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Configurato tramite variabili d'ambiente
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Database MongoDB
                </label>
                <input
                  type="text"
                  defaultValue="MongoDB Atlas"
                  disabled
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-gray-500 dark:text-gray-400"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Configurato tramite DATABASE_URL
                </p>
              </div>
            </div>
          </div>

          {/* Impostazioni Utente */}
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <User className="h-5 w-5 text-purple-600" />
              Profilo Utente
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  value={session.user?.email || ""}
                  disabled
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-gray-500 dark:text-gray-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome
                </label>
                <input
                  type="text"
                  defaultValue={session.user?.name || ""}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ruolo
                </label>
                <input
                  type="text"
                  value={user?.role || "user"}
                  disabled
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-gray-500 dark:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Sicurezza */}
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Shield className="h-5 w-5 text-red-600" />
              Sicurezza
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Autenticazione a due fattori</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Aggiungi un livello extra di sicurezza</p>
                </div>
                <button className="rounded-md bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600">
                  Abilita
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Sessioni attive</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gestisci i dispositivi connessi</p>
                </div>
                <button className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
                  Visualizza
                </button>
              </div>
            </div>
          </div>

          {/* Salva modifiche */}
          <div className="flex justify-end gap-3">
            <Link
              href="/dashboard"
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Annulla
            </Link>
            <button className="rounded-md bg-blue-600 dark:bg-blue-500 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600">
              Salva Modifiche
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
