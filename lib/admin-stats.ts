import { prisma } from "@/lib/prisma";

// Orders where payment actually succeeded, regardless of fulfillment stage —
// this is the "money received" bucket used for both the paid-count and
// revenue stats. Matches ACTIONABLE_STATUSES + COMPLETED (i.e. everything
// past PENDING_PAYMENT that isn't a dead end like FAILED/EXPIRED/CANCELLED).
const PAID_STATUSES = ["PAID", "PROCESSING", "COMPLETED"];

export type OrderSummaryStats = {
  totalOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  totalRevenue: number;
};

export async function getOrderSummaryStats(): Promise<OrderSummaryStats> {
  const [totalOrders, paidOrders, unpaidOrders, revenue] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: PAID_STATUSES } } }),
    prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
    prisma.order.aggregate({
      where: { status: { in: PAID_STATUSES } },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalOrders,
    paidOrders,
    unpaidOrders,
    totalRevenue: revenue._sum.amount ?? 0,
  };
}

export type DailyOrderPoint = {
  date: string; // "YYYY-MM-DD", Asia/Jakarta
  totalOrders: number;
  paidOrders: number;
};

// Asia/Jakarta calendar date for a timestamp — matches the WIB-based day
// boundaries used elsewhere (lib/maintenance.ts) so "today" means the same
// thing across the admin dashboard.
function jakartaDateKey(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // en-CA gives YYYY-MM-DD directly
}

// Buckets by application code, not a DB date-trunc function: SQLite (local
// dev) and Postgres (production) don't share date-grouping syntax, and this
// codebase's portability rule is to filter/sort in JS when in doubt (see the
// schema.prisma header comment) rather than let dev/prod behavior drift.
export async function getDailyOrderStats(days: number): Promise<DailyOrderPoint[]> {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: startDate } },
    select: { createdAt: true, paidAt: true },
  });

  const buckets = new Map<string, { totalOrders: number; paidOrders: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    buckets.set(jakartaDateKey(d), { totalOrders: 0, paidOrders: 0 });
  }

  for (const order of orders) {
    const createdKey = jakartaDateKey(order.createdAt);
    const createdBucket = buckets.get(createdKey);
    if (createdBucket) createdBucket.totalOrders += 1;

    if (order.paidAt) {
      const paidKey = jakartaDateKey(order.paidAt);
      const paidBucket = buckets.get(paidKey);
      if (paidBucket) paidBucket.paidOrders += 1;
    }
  }

  return Array.from(buckets.entries()).map(([date, counts]) => ({ date, ...counts }));
}
