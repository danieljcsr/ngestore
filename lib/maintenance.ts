import { prisma } from "@/lib/prisma";

export async function getMaintenanceSettings() {
  // orderBy makes this deterministic (always the earliest row) if a
  // check-then-create race ever produces more than one — see the
  // lib/site-contact.ts comment for how this actually happened in practice
  // for a sibling singleton settings table.
  const existing = await prisma.maintenanceSetting.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  return prisma.maintenanceSetting.create({ data: {} });
}

export const DEFAULT_MAINTENANCE_MESSAGE =
  "Transaksi sedang ditutup sementara sesuai jam operasional. Silakan coba lagi setelah jam tutup berakhir.";

// hourCycle: "h23" is required, not hour12: false — with en-US + hour12:false
// some ICU implementations render midnight as "24" instead of "00", which
// would silently break the exact boundary this feature depends on.
function getJakartaMinutesSinceMidnight(now: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(now);
  const hours = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minutes = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hours * 60 + minutes;
}

function toMinutesSinceMidnight(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function isWithinMaintenanceWindow(
  settings: { isEnabled: boolean; startTime: string; endTime: string },
  now: Date = new Date(),
): boolean {
  if (!settings.isEnabled) return false;

  const current = getJakartaMinutesSinceMidnight(now);
  const start = toMinutesSinceMidnight(settings.startTime);
  const end = toMinutesSinceMidnight(settings.endTime);

  if (start === end) return false;
  // A window like 23:00-01:00 wraps past midnight (start > end in minutes),
  // so "inside the window" means "at/after start OR before end" instead of
  // the usual "at/after start AND before end".
  return start < end ? current >= start && current < end : current >= start || current < end;
}
