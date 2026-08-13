import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { formatRupiah, formatDateTime } from "@/lib/format";
import { ACTIONABLE_STATUSES, type OrderStatus } from "@/lib/types";
import { StatusPill } from "@/components/ui/StatusPill";
import { Card } from "@/components/ui/Card";
import { OrderActions } from "./OrderActions";

type FilterValue = "queue" | "all" | "completed" | "failed";

const TABS: { value: FilterValue; label: string }[] = [
  { value: "queue", label: "Perlu Diproses" },
  { value: "all", label: "Semua" },
  { value: "completed", label: "Selesai" },
  { value: "failed", label: "Gagal/Kedaluwarsa" },
];

function resolveFilter(value: FilterValue): { status: OrderStatus | { in: OrderStatus[] } } | Record<string, never> {
  switch (value) {
    case "all":
      return {};
    case "completed":
      return { status: "COMPLETED" };
    case "failed":
      return { status: { in: ["FAILED", "EXPIRED", "CANCELLED"] } };
    case "queue":
    default:
      return { status: { in: ACTIONABLE_STATUSES } };
  }
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeTab: FilterValue = TABS.some((tab) => tab.value === status)
    ? (status as FilterValue)
    : "queue";

  const where = resolveFilter(activeTab);

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pesanan</h1>
        <p className="mt-1 text-sm text-muted">Kelola dan proses pesanan top up pelanggan.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "queue" ? "/admin/orders" : `/admin/orders?status=${tab.value}`}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              activeTab === tab.value
                ? "border-brand-indigo/50 bg-brand-indigo/15 text-foreground"
                : "border-border bg-surface-2 text-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Card className="overflow-x-auto p-0">
        {orders.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">
            Tidak ada pesanan pada kategori ini.
          </div>
        ) : (
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Kode</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Game &amp; Item</th>
                <th className="px-4 py-3 font-medium">ID Pemain</th>
                <th className="px-4 py-3 font-medium">Kontak</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Waktu</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border/60 align-top last:border-b-0">
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{order.orderCode}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={order.status as OrderStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{order.gameName}</p>
                    <p className="text-xs text-muted">{order.denominationName}</p>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    <p>{order.playerId}</p>
                    {order.zoneId ? <p className="text-xs text-muted">Zone: {order.zoneId}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    <p>{order.contactName}</p>
                    <p className="text-xs text-muted">{order.contactWhatsapp}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {formatRupiah(order.amount)}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {order.providerStatus ? (
                      <>
                        <p className="font-medium text-foreground">{order.providerStatus}</p>
                        {order.providerMessage && (
                          <p className="mt-0.5 max-w-[180px] text-muted">
                            {order.providerMessage}
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="text-muted">Belum dikirim</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{formatDateTime(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <OrderActions
                      order={{
                        id: order.id,
                        status: order.status as OrderStatus,
                        adminNote: order.adminNote,
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
