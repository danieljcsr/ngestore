"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatRupiah, formatDateTime } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export type OrderStatusViewData = {
  orderCode: string;
  gameName: string;
  denominationName: string;
  amount: number;
  playerId: string;
  zoneId: string | null;
  status: OrderStatus;
  createdAt: string;
  paidAt: string | null;
  fulfilledAt: string | null;
};

const STATUS_MESSAGE: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Menunggu pembayaran kamu. Selesaikan pembayaran untuk melanjutkan.",
  PAID: "Pembayaran diterima, top up sedang diproses. Biasanya selesai dalam beberapa menit.",
  PROCESSING: "Pembayaran diterima, top up sedang diproses. Biasanya selesai dalam beberapa menit.",
  COMPLETED: "Top up berhasil! Diamond/UC sudah dikirim ke akunmu.",
  FAILED: "Pembayaran tidak berhasil. Silakan buat pesanan baru.",
  CANCELLED: "Pembayaran tidak berhasil. Silakan buat pesanan baru.",
  EXPIRED: "Waktu pembayaran sudah habis. Silakan buat pesanan baru.",
};

export function OrderStatusView({ order }: { order: OrderStatusViewData }) {
  const [data, setData] = useState<OrderStatusViewData>(order);
  const isPolling = data.status === "PENDING_PAYMENT";

  useEffect(() => {
    if (data.status !== "PENDING_PAYMENT") return;

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(data.orderCode)}`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const fresh = (await res.json()) as OrderStatusViewData;
        if (!cancelled) {
          setData(fresh);
        }
      } catch {
        // ignore transient network errors, keep polling
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [data.status, data.orderCode]);

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Kode Pesanan
            </p>
            <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
              {data.orderCode}
            </h1>
          </div>
          <StatusPill status={data.status} />
        </div>

        <Card className="mt-6 p-6">
          <p className="text-sm text-foreground/90">{STATUS_MESSAGE[data.status]}</p>
          {isPolling && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-border border-t-brand-cyan" />
              Memuat status terbaru...
            </div>
          )}

          <dl className="mt-6 divide-y divide-border border-t border-border">
            <Row label="Game" value={data.gameName} />
            <Row label="Nominal" value={data.denominationName} />
            <Row label="Player ID" value={data.playerId} />
            {data.zoneId && <Row label="Zone ID" value={data.zoneId} />}
            <Row label="Total Bayar" value={formatRupiah(data.amount)} />
            <Row label="Tanggal Pesanan" value={formatDateTime(data.createdAt)} />
            {data.paidAt && <Row label="Dibayar Pada" value={formatDateTime(data.paidAt)} />}
            {data.fulfilledAt && (
              <Row label="Diselesaikan Pada" value={formatDateTime(data.fulfilledAt)} />
            )}
          </dl>
        </Card>
      </div>
    </Container>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
