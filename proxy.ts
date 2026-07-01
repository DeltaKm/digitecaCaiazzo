import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

async function getUserRole(req: NextRequest): Promise<string | null> {
  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token"
  const token =
    req.cookies.get(cookieName)?.value ??
    req.cookies.get(cookieName + ".0")?.value
  if (!token) return null

  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return (payload as any).userRole as string | null
  } catch {
    return null
  }
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Percorsi sempre accessibili
  if (
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon")
  ) {
    return NextResponse.next()
  }

  // Legge lo stato manutenzione dal DB tramite API interna
  let isMaintenanceMode = false
  try {
    const statusUrl = new URL("/api/maintenance-status", req.nextUrl.origin)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(statusUrl.toString(), { signal: controller.signal })
    clearTimeout(timeout)
    const data = await res.json()
    isMaintenanceMode = data.isActive === true
  } catch {
    // In caso di errore lascia passare
  }

  if (!isMaintenanceMode) {
    return NextResponse.next()
  }

  // Gli admin passano comunque
  const userRole = await getUserRole(req)
  if (userRole === "admin") {
    return NextResponse.next()
  }

  // Chi ha inserito la password di sblocco passa
  const bypass = req.cookies.get("maintenance_bypass")?.value
  if (bypass === "1") {
    return NextResponse.next()
  }

  return NextResponse.redirect(new URL("/maintenance", req.url))
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
