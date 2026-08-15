"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";

type BannerRow = {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  altText: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export function BannersManager({ initialBanners }: { initialBanners: BannerRow[] }) {
  const router = useRouter();
  const [banners, setBanners] = useState(
    [...initialBanners].sort((a, b) => a.sortOrder - b.sortOrder),
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "banners");

      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const uploadResult = await uploadRes.json().catch(() => null);

      if (!uploadRes.ok) {
        setError(uploadResult?.error ?? "Gagal mengunggah gambar.");
        return;
      }

      const createRes = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadResult.url }),
      });
      const created = await createRes.json().catch(() => null);

      if (!createRes.ok) {
        setError(created?.error ?? "Gagal menyimpan banner.");
        return;
      }

      setBanners((prev) => [...prev, created]);
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
    } finally {
      setUploading(false);
    }
  }

  async function updateBanner(id: string, data: Partial<BannerRow>) {
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error ?? "Gagal menyimpan perubahan.");
        return;
      }

      setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, ...result } : b)));
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(banner: BannerRow) {
    if (!window.confirm("Hapus banner ini?")) return;

    setBusyId(banner.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/banners/${banner.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error ?? "Gagal menghapus banner.");
        return;
      }

      setBanners((prev) => prev.filter((b) => b.id !== banner.id));
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const current = banners[index];
    const target = banners[targetIndex];

    const reordered = [...banners];
    reordered[index] = target;
    reordered[targetIndex] = current;
    setBanners(reordered);

    setBusyId(current.id);
    setError(null);
    try {
      await Promise.all([
        fetch(`/api/admin/banners/${current.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: target.sortOrder }),
        }),
        fetch(`/api/admin/banners/${target.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: current.sortOrder }),
        }),
      ]);
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <label>
          <span
            className={`inline-flex cursor-pointer items-center rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-white/5 ${uploading ? "pointer-events-none opacity-50" : ""}`}
          >
            {uploading ? "Mengunggah..." : "+ Tambah Banner"}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            disabled={uploading}
            className="sr-only"
          />
        </label>
        <p className="mt-2 text-xs text-muted">
          Rasio lebar disarankan sekitar 21:6 (banner panjang mendatar). Maks 2MB, format JPG/PNG/WEBP.
        </p>
      </Card>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {banners.map((banner, index) => (
          <Card key={banner.id} className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banner.imageUrl}
                alt={banner.altText}
                className="h-24 w-full shrink-0 rounded-lg object-cover sm:w-64"
              />

              <div className="flex flex-1 flex-col gap-3">
                <div>
                  <Label htmlFor={`link-${banner.id}`}>Link tujuan (opsional)</Label>
                  <Input
                    id={`link-${banner.id}`}
                    defaultValue={banner.linkUrl ?? ""}
                    placeholder="/game/mobile-legends"
                    onBlur={(e) => {
                      const value = e.target.value.trim() || null;
                      if (value !== banner.linkUrl) updateBanner(banner.id, { linkUrl: value });
                    }}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={banner.isActive}
                      onChange={(e) => updateBanner(banner.id, { isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-border bg-surface-2 accent-brand-indigo"
                    />
                    Aktif
                  </label>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busyId === banner.id || index === 0}
                  onClick={() => handleMove(index, -1)}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busyId === banner.id || index === banners.length - 1}
                  onClick={() => handleMove(index, 1)}
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={busyId === banner.id}
                  onClick={() => handleDelete(banner)}
                >
                  Hapus
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {banners.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted">
            Belum ada banner. Klik &ldquo;+ Tambah Banner&rdquo; untuk menambahkan.
          </Card>
        )}
      </div>
    </div>
  );
}
