"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";

type MaintenanceSettingsData = {
  isEnabled: boolean;
  startTime: string;
  endTime: string;
  message: string | null;
};

export function MaintenanceSettingsForm({ settings }: { settings: MaintenanceSettingsData }) {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(settings.isEnabled);
  const [startTime, setStartTime] = useState(settings.startTime);
  const [endTime, setEndTime] = useState(settings.endTime);
  const [message, setMessage] = useState(settings.message ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const wrapsPastMidnight = startTime > endTime;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    if (startTime === endTime) {
      setError("Jam mulai dan jam selesai tidak boleh sama.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/maintenance-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled,
          startTime,
          endTime,
          message: message.trim() || null,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error ?? "Gagal menyimpan pengaturan.");
        setSaving(false);
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="space-y-5 p-6">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="h-5 w-5 rounded border-border bg-surface-2 accent-brand-indigo"
          />
          <span>
            <span className="block text-sm font-semibold text-foreground">
              Tutup transaksi otomatis di jam tertentu
            </span>
            <span className="block text-xs text-muted">
              Kalau dimatikan, pelanggan bisa transaksi 24 jam seperti biasa — tidak ada
              yang berubah dari cara kerja sekarang.
            </span>
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="startTime">Jam Mulai Tutup (WIB)</Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="endTime">Jam Buka Kembali (WIB)</Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <p className="text-xs text-muted">
          {wrapsPastMidnight
            ? `Transaksi ditutup dari jam ${startTime} sampai ${endTime} keesokan harinya (melewati tengah malam).`
            : `Transaksi ditutup dari jam ${startTime} sampai ${endTime} di hari yang sama.`}
        </p>

        <div>
          <Label htmlFor="message">Pesan untuk Pelanggan (opsional)</Label>
          <Textarea
            id="message"
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Transaksi sedang ditutup sementara sesuai jam operasional. Silakan coba lagi setelah jam tutup berakhir."
          />
          <p className="mt-1 text-xs text-muted">
            Kosongkan untuk pakai pesan default di atas. Pesan ini muncul di halaman
            checkout dan kalau pelanggan tetap mencoba membayar saat jam tutup.
          </p>
        </div>
      </Card>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      {saved && !error && (
        <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          Pengaturan tersimpan.
        </div>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? "Menyimpan..." : "Simpan Pengaturan"}
      </Button>
    </form>
  );
}
