import { ShoppingBag, CircleCheck, Clock, Wallet } from "lucide-react";
import { getOrderSummaryStats, getDailyOrderStats } from "@/lib/admin-stats";
import { formatRupiah } from "@/lib/format";
import { StatTile } from "./StatTile";
import { OrdersChart } from "./OrdersChart";
import { Card } from "@/components/ui/Card";

const numberFormatter = new Intl.NumberFormat("id-ID");

export default async function AdminSummaryPage() {
  const [stats, dailyStats] = await Promise.all([
    getOrderSummaryStats(),
    getDailyOrderStats(30),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ringkasan</h1>
        <p className="mt-1 text-sm text-muted">Gambaran umum performa toko Anda.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total Pesanan"
          value={numberFormatter.format(stats.totalOrders)}
          icon={<ShoppingBag size={20} />}
          accent="indigo"
        />
        <StatTile
          label="Total yang Dibayarkan"
          value={numberFormatter.format(stats.paidOrders)}
          icon={<CircleCheck size={20} />}
          accent="success"
        />
        <StatTile
          label="Pesanan Belum Dibayar"
          value={numberFormatter.format(stats.unpaidOrders)}
          icon={<Clock size={20} />}
          accent="amber"
        />
        <StatTile
          label="Total Pendapatan"
          value={formatRupiah(stats.totalRevenue)}
          icon={<Wallet size={20} />}
          accent="cyan"
        />
      </div>

      <Card className="p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">Pesanan per Hari</h2>
          <p className="mt-1 text-sm text-muted">
            Perbandingan total pesanan masuk dengan pesanan yang sudah dibayar.
          </p>
        </div>
        <div className="mt-5">
          <OrdersChart data={dailyStats} />
        </div>
      </Card>
    </div>
  );
}
