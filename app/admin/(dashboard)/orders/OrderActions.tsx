"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { OrderStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "PENDING_PAYMENT", label: "Menunggu Pembayaran" },
  { value: "PAID", label: "Sudah Dibayar" },
  { value: "PROCESSING", label: "Sedang Diproses" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "FAILED", label: "Gagal" },
  { value: "EXPIRED", label: "Kedaluwarsa" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

type OrderActionsProps = {
  order: {
    id: string;
    status: OrderStatus;
    adminNote: string | null;
  };
};

const DISPATCHABLE_STATUSES: OrderStatus[] = ["PAID", "PROCESSING"];

export function OrderActions({ order }: OrderActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [adminNote, setAdminNote] = useState(order.adminNote ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<string | null>(null);

  async function handleDispatch() {
    setIsDispatching(true);
    setDispatchResult(null);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/dispatch`, { method: "POST" });
      const data = await res.json().catch(() => null);
      setDispatchResult(
        data?.summary ?? data?.error ?? (res.ok ? "Terkirim." : "Gagal mengirim ke provider."),
      );
      router.refresh();
    } catch {
      setDispatchResult("Tidak dapat menghubungi server.");
    } finally {
      setIsDispatching(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Gagal menyimpan perubahan.");
        setIsSaving(false);
        return;
      }

      router.refresh();
      setIsSaving(false);
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setIsSaving(false);
    }
  }

  return (
    <div className="flex w-64 flex-col gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as OrderStatus)}
        className={cn(
          "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-foreground",
          "outline-none transition focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/30",
        )}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <Textarea
        value={adminNote}
        onChange={(e) => setAdminNote(e.target.value)}
        placeholder="Catatan admin (opsional)"
        rows={2}
        maxLength={500}
        className="text-xs"
      />

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      <Button size="sm" onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? "Menyimpan..." : "Simpan"}
      </Button>

      {DISPATCHABLE_STATUSES.includes(order.status) && (
        <Button
          size="sm"
          variant="secondary"
          onClick={handleDispatch}
          disabled={isDispatching}
          className="w-full"
        >
          {isDispatching ? "Mengirim..." : "Kirim ke Provider"}
        </Button>
      )}
      {dispatchResult ? <p className="text-xs text-muted">{dispatchResult}</p> : null}
    </div>
  );
}
