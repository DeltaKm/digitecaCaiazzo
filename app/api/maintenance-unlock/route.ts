import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (!password || password !== process.env.MAINTENANCE_PASSWORD) {
    return NextResponse.json({ error: "Password non valida" }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set("maintenance_bypass", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 ore
  })
  return response
}
