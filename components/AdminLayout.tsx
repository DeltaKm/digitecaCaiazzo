"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { FolderOpen, FileText, FileJson, Search, BarChart3, Settings } from "lucide-react"
import { useState, useTransition } from "react"
import Loader from "./Loader"
import { ThemeToggle } from "./ThemeToggle"
import SignOutButton from "./SignOutButton"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loadingMessage, setLoadingMessage] = useState("")

  const navItems = [
    {
      href: "/dashboard",
      label: "Categorie",
      icon: FolderOpen
    },
    {
      href: "/admin/documents",
      label: "Gestione Documenti",
      icon: FileText
    },
    {
      href: "/admin/search",
      label: "Ricerca Avanzata",
      icon: Search
    },
    {
      href: "/admin/stats",
      label: "Statistiche",
      icon: BarChart3
    },

  ]

  const handleNavigation = (href: string, label: string) => {
    setLoadingMessage(`Caricamento ${label}...`)
    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <>
      {isPending && <Loader message={loadingMessage} />}
      
      <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Admin</h2>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <SignOutButton />
              </div>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigation(item.href, item.label)}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600 dark:bg-blue-500 text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-white dark:bg-gray-900">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
