import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getMaintenanceMode, setMaintenanceMode } from "@/lib/site-settings"

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const isActive = await getMaintenanceMode()
  return NextResponse.json({ isActive })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })
  }

  const { enabled } = await req.json()
  await setMaintenanceMode(!!enabled)
  return NextResponse.json({ isActive: !!enabled })
}
