"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";

type ContactSettingsData = {
  csWhatsapp: string | null;
  csEmail: string | null;
};

export function ContactSettingsForm({ settings }: { settings: ContactSettingsData }) {
  const router = useRouter();
  const [csWhatsapp, setCsWhatsapp] = useState(settings.csWhatsapp ?? "");
  const [csEmail, setCsEmail] = useState(settings.csEmail ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/admin/site-contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csWhatsapp: csWhatsapp.trim() || null,
          csEmail: csEmail.trim() || null,
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
        <div>
          <Label htmlFor="csWhatsapp">Nomor WhatsApp Customer Service</Label>
          <Input
            id="csWhatsapp"
            value={csWhatsapp}
            onChange={(e) => setCsWhatsapp(e.target.value)}
            placeholder="08xxxxxxxxxx"
          />
          <p className="mt-1 text-xs text-muted">
            Ditampilkan di footer sebagai tautan yang langsung membuka chat WhatsApp.
          </p>
        </div>

        <div>
          <Label htmlFor="csEmail">Email Customer Service</Label>
          <Input
            id="csEmail"
            type="email"
            value={csEmail}
            onChange={(e) => setCsEmail(e.target.value)}
            placeholder="cso@ngestore.id"
          />
          <p className="mt-1 text-xs text-muted">
            Ditampilkan di footer sebagai tautan yang langsung membuka aplikasi email.
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
