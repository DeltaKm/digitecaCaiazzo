"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Wrench, Lock } from "lucide-react"

export default function MaintenancePage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/maintenance-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push("/")
        router.refresh()
      } else {
        setError("Password non valida")
        setLoading(false)
      }
    } catch {
      setError("Errore di rete")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-6">
              <Wrench className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sito in manutenzione
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            La Digiteca del Comune di Caiazzo è temporaneamente offline per
            interventi di manutenzione. Torneremo presto.
          </p>
        </div>


        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Lock className="h-4 w-4" />
            Accesso riservato
          </div>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          <input
            type="password"
            placeholder="Password di accesso"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Verifica..." : "Accedi"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600">
          Città di Caiazzo Digiteca ©
        </p>
      </div>
    </div>
  )
}
