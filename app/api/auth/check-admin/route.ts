import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ isAdmin: false }, { status: 200 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    return NextResponse.json({ 
      isAdmin: user?.role === 'admin',
      user: {
        email: user?.email,
        name: user?.name,
        role: user?.role
      }
    })
  } catch (error) {
    console.error('Error checking admin status:', error)
    return NextResponse.json({ isAdmin: false }, { status: 200 })
  }
}
