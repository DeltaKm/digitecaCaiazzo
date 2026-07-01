import { prisma } from "@/lib/prisma"

export async function getMaintenanceMode(): Promise<boolean> {
  try {
    const settings = await prisma.siteSettings.findFirst({
      where: { singleton: "main" },
    })
    return settings?.maintenanceMode ?? false
  } catch {
    return false
  }
}

export async function setMaintenanceMode(value: boolean): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { singleton: "main" },
    update: { maintenanceMode: value },
    create: { singleton: "main", maintenanceMode: value },
  })
}
