import { NextResponse } from "next/server"
import { getMaintenanceMode } from "@/lib/site-settings"

export async function GET() {
  const isActive = await getMaintenanceMode()
  return NextResponse.json({ isActive })
}
