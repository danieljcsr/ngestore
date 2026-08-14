import { prisma } from "@/lib/prisma";

// Fixed id (not cuid()) so this upsert is race-free: two requests racing to
// create the singleton on first-ever access both target the same row via
// Postgres's ON CONFLICT, instead of a check-then-create race where both see
// "no row yet" and each create their own — which is exactly what happened
// here when a findFirst()+create() version of this shipped for a few
// minutes (root layout and an admin request raced on an empty table).
const SITE_CONTACT_SINGLETON_ID = "site-contact";

export async function getSiteContactSettings() {
  return prisma.siteContactSetting.upsert({
    where: { id: SITE_CONTACT_SINGLETON_ID },
    update: {},
    create: { id: SITE_CONTACT_SINGLETON_ID },
  });
}
