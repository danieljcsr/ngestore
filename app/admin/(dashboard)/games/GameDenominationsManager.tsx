"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { formatRupiah } from "@/lib/format";

type Denomination = {
  id: string;
  name: string;
  price: number;
  note: string | null;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  providerSku: string | null;
};

function DenominationRow({ denomination }: { denomination: Denomination }) {
  const router = useRouter();
  const [name, setName] = useState(denomination.name);
  const [price, setPrice] = useState(String(denomination.price));
  const [note, setNote] = useState(denomination.note ?? "");
  const [providerSku, setProviderSku] = useState(denomination.providerSku ?? "");
  const [isActive, setIsActive] = useState(denomination.isActive);
  const [isPopular, setIsPopular] = useState(denomination.isPopular);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const priceNumber = Number(price);
    if (!name.trim()) {
      setError("Nama tidak boleh kosong.");
      setSaving(false);
      return;
    }
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      setError("Harga harus berupa angka positif.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/denominations/" + denomination.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Send fields as typed (even ""): the API treats an omitted/undefined key
          // as "leave unchanged" and only clears a field when it explicitly receives
          // "" (or null for providerSku).
          name,
          price: priceNumber,
          note,
          providerSku: providerSku.trim() || null,
          isActive,
          isPopular,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error ?? "Gagal menyimpan perubahan.");
        setSaving(false);
        return;
      }

      router.refresh();
      setSaving(false);
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-2 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label className="text-xs">Nama</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Harga</Label>
          <Input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Catatan</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
        </div>
        <div>
          <Label className="text-xs">Kode Produk Provider (SKU)</Label>
          <Input
            value={providerSku}
            onChange={(e) => setProviderSku(e.target.value)}
            placeholder="Opsional, misal: ML86"
            className="font-mono"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-surface-2 accent-brand-indigo"
          />
          Aktif
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={isPopular}
            onChange={(e) => setIsPopular(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-surface-2 accent-brand-indigo"
          />
          Populer
        </label>
        <Button type="button" size="sm" variant="secondary" onClick={handleSave} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
        <p className="text-xs text-muted">Harga saat ini: {formatRupiah(denomination.price)}</p>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function GameDenominationsManager({
  gameId,
  denominations,
}: {
  gameId: string;
  denominations: Denomination[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [providerSku, setProviderSku] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const priceNumber = Number(price);
    if (!name.trim()) {
      setError("Nama tidak boleh kosong.");
      setSubmitting(false);
      return;
    }
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      setError("Harga harus berupa angka positif.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/games/" + gameId + "/denominations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: priceNumber,
          note: note || undefined,
          providerSku: providerSku.trim() || undefined,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error ?? "Gagal menambahkan nominal.");
        setSubmitting(false);
        return;
      }

      setName("");
      setPrice("");
      setNote("");
      setProviderSku("");
      router.refresh();
      setSubmitting(false);
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
      setSubmitting(false);
    }
  }

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground">Nominal Top Up</h2>
        <p className="mt-1 text-sm text-muted">
          Kelola pilihan nominal yang tersedia untuk game ini. Isi &ldquo;Kode Produk
          Provider&rdquo; supaya nominal ini bisa dikirim otomatis ke provider top up
          (lihat Pengaturan Provider).
        </p>
      </div>

      <div className="space-y-3">
        {denominations.map((denomination) => (
          <DenominationRow key={denomination.id} denomination={denomination} />
        ))}
        {denominations.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted">
            Belum ada nominal. Tambahkan nominal pertama di bawah.
          </p>
        )}
      </div>

      <form
        onSubmit={handleAdd}
        className="grid gap-3 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div>
          <Label className="text-xs">Nama</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="86 Diamonds" />
        </div>
        <div>
          <Label className="text-xs">Harga</Label>
          <Input
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="20000"
          />
        </div>
        <div>
          <Label className="text-xs">Catatan</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
        </div>
        <div>
          <Label className="text-xs">Kode Produk (SKU)</Label>
          <Input
            value={providerSku}
            onChange={(e) => setProviderSku(e.target.value)}
            placeholder="Opsional"
            className="font-mono"
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" size="sm" disabled={submitting} className="w-full">
            {submitting ? "Menambahkan..." : "Tambah Nominal"}
          </Button>
        </div>
        {error && <p className="text-xs text-danger sm:col-span-2 lg:col-span-5">{error}</p>}
      </form>
    </Card>
  );
}
