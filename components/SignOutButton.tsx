"use client"

import { signOut } from "next-auth/react"

export default function SignOutButton() {
  const handleSignOut = () => {
    // window.location.origin è SEMPRE il dominio corrente del browser
    // NON usare process.env perché viene baked-in al build time
    signOut({ callbackUrl: `${window.location.origin}/` })
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      Esci
    </button>
  )
}
