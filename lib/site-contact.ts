import { prisma } from "@/lib/prisma";

export async function getSiteContactSettings() {
  const existing = await prisma.siteContactSetting.findFirst();
  if (existing) return existing;
  return prisma.siteContactSetting.create({ data: {} });
}
