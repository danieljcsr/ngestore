"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";

type RequestFormat = "digiflazz" | "bearer_json";

type ProviderSettingsData = {
  isEnabled: boolean;
  providerName: string;
  apiBaseUrl: string | null;
  apiUsername: string | null;
  apiKey: string | null;
  requestFormat: RequestFormat;
  useMd5Signature: boolean;
  transactionPin: string | null;
  outboundProxyUrl: string | null;
  callbackToken: string | null;
};

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function ProviderSettingsForm({
  settings,
  siteUrl,
}: {
  settings: ProviderSettingsData;
  siteUrl: string;
}) {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(settings.isEnabled);
  const [providerName, setProviderName] = useState(settings.providerName);
  const [apiBaseUrl, setApiBaseUrl] = useState(settings.apiBaseUrl ?? "");
  const [apiUsername, setApiUsername] = useState(settings.apiUsername ?? "");
  const [apiKey, setApiKey] = useState(settings.apiKey ?? "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [requestFormat, setRequestFormat] = useState<RequestFormat>(settings.requestFormat);
  const [useMd5Signature, setUseMd5Signature] = useState(settings.useMd5Signature);
  const [transactionPin, setTransactionPin] = useState(settings.transactionPin ?? "");
  const [showPin, setShowPin] = useState(false);
  const [outboundProxyUrl, setOutboundProxyUrl] = useState(settings.outboundProxyUrl ?? "");
  const [callbackToken, setCallbackToken] = useState(settings.callbackToken ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const callbackUrl =
    siteUrl && callbackToken
      ? `${siteUrl}/api/provider/callback?token=${callbackToken}`
      : null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const usernameRequired = requestFormat === "digiflazz";
    if (
      isEnabled &&
      (!apiBaseUrl.trim() || !apiKey.trim() || (usernameRequired && !apiUsername.trim()))
    ) {
      setError(
        usernameRequired
          ? "Isi URL API, Username, dan API Key dulu sebelum mengaktifkan."
          : "Isi URL API dan API Key dulu sebelum mengaktifkan.",
      );
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/provider-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled,
          providerName,
          apiBaseUrl: apiBaseUrl.trim() || null,
          apiUsername: apiUsername.trim() || null,
          apiKey: apiKey.trim() || null,
          requestFormat,
          useMd5Signature,
          transactionPin: transactionPin.trim() || null,
          outboundProxyUrl: outboundProxyUrl.trim() || null,
          callbackToken: callbackToken.trim() || null,
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

  async function handleCopyCallbackUrl() {
    if (!callbackUrl) return;
    try {
      await navigator.clipboard.writeText(callbackUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, insecure context) — not worth surfacing
      // as an error, the URL is still selectable/visible on screen.
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
              Aktifkan pengiriman otomatis ke provider
            </span>
            <span className="block text-xs text-muted">
              Kalau dimatikan, semua pesanan tetap harus diproses manual di halaman
              Pesanan — tidak ada yang berubah dari cara kerja sekarang.
            </span>
          </span>
        </label>

        <div>
          <Label htmlFor="providerName">Nama Provider</Label>
          <Input
            id="providerName"
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
            placeholder="misal: Media Cakrawangsa"
          />
        </div>

        <div>
          <Label htmlFor="requestFormat">Format API</Label>
          <select
            id="requestFormat"
            value={requestFormat}
            onChange={(e) => setRequestFormat(e.target.value as RequestFormat)}
            className="h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-foreground focus:border-brand-indigo focus:outline-none"
          >
            <option value="digiflazz">Digiflazz (username + buyer_sku_code + sign MD5)</option>
            <option value="bearer_json">Bearer Token + JSON (rc numerik, misal Media Cakrawangsa)</option>
          </select>
          <p className="mt-1 text-xs text-muted">
            Sesuaikan dengan dokumentasi API provider Anda. Kalau tidak yakin, tanyakan
            format request/response ke support provider.
          </p>
        </div>

        <div>
          <Label htmlFor="apiBaseUrl">URL API Transaksi</Label>
          <Input
            id="apiBaseUrl"
            value={apiBaseUrl}
            onChange={(e) => setApiBaseUrl(e.target.value)}
            placeholder={
              requestFormat === "bearer_json"
                ? "https://api.provider-anda.com/reseller/api/v1/purchase"
                : "https://api.provider-anda.com/v1/transaction"
            }
          />
          <p className="mt-1 text-xs text-muted">
            Isi URL lengkap endpoint transaksi/pembelian, bukan cuma &ldquo;base_url&rdquo;
            dari dokumentasi provider — biasanya ada akhiran seperti /purchase atau
            /transaction. Kalau cuma base_url yang diisi, request akan gagal dengan error
            404 Not Found.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {requestFormat === "digiflazz" && (
            <div>
              <Label htmlFor="apiUsername">Username API</Label>
              <Input
                id="apiUsername"
                value={apiUsername}
                onChange={(e) => setApiUsername(e.target.value)}
              />
            </div>
          )}
          <div>
            <Label htmlFor="apiKey">
              {requestFormat === "bearer_json" ? "API Key (Bearer Token)" : "API Key"}
            </Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono"
              />
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setShowApiKey((v) => !v)}
              >
                {showApiKey ? "Sembunyikan" : "Lihat"}
              </Button>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="transactionPin">PIN Transaksi (opsional)</Label>
          <div className="flex gap-2">
            <Input
              id="transactionPin"
              type={showPin ? "text" : "password"}
              value={transactionPin}
              onChange={(e) => setTransactionPin(e.target.value)}
              placeholder="Kosongkan kalau provider tidak pakai PIN"
              className="font-mono"
            />
            <Button type="button" variant="secondary" size="md" onClick={() => setShowPin((v) => !v)}>
              {showPin ? "Sembunyikan" : "Lihat"}
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted">
            Beberapa provider mewajibkan PIN transaksi tambahan (biasanya dipasangkan
            dengan whitelist IP). Diisi otomatis ke tiap request kalau field ini terisi.
          </p>
        </div>

        {requestFormat === "digiflazz" && (
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={useMd5Signature}
              onChange={(e) => setUseMd5Signature(e.target.checked)}
              className="h-5 w-5 rounded border-border bg-surface-2 accent-brand-indigo"
            />
            <span>
              <span className="block text-sm font-semibold text-foreground">
                Gunakan tanda tangan MD5 (standar Digiflazz)
              </span>
              <span className="block text-xs text-muted">
                md5(username + API key + ref_id) dikirim sebagai field &ldquo;sign&rdquo;.
                Matikan kalau provider Anda tidak memakai skema ini.
              </span>
            </span>
          </label>
        )}
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Alamat IP Tetap (Static IP)
          </h2>
          <p className="mt-1 text-sm text-muted">
            Situs ini di-hosting secara serverless, jadi tidak punya alamat IP tetap
            secara default. Kalau provider Anda mewajibkan whitelist IP, daftar ke
            layanan static IP (misalnya{" "}
            <a
              href="https://usefixie.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-cyan underline"
            >
              Fixie
            </a>{" "}
            — ada paket gratis), lalu tempel URL proxy yang mereka berikan di sini.
            Kosongkan kalau provider Anda tidak mewajibkan whitelist IP.
          </p>
        </div>

        <div>
          <Label htmlFor="outboundProxyUrl">URL Proxy Keluar</Label>
          <Input
            id="outboundProxyUrl"
            value={outboundProxyUrl}
            onChange={(e) => setOutboundProxyUrl(e.target.value)}
            placeholder="http://user:pass@host:port"
            className="font-mono"
          />
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">Callback dari Provider</h2>
          <p className="mt-1 text-sm text-muted">
            Beri URL ini ke provider Anda (biasanya di kolom &ldquo;Callback URL&rdquo; /
            &ldquo;Webhook URL&rdquo; di dashboard mereka) supaya status pesanan bisa
            update otomatis begitu provider selesai memproses.
          </p>
        </div>

        <div>
          <Label htmlFor="callbackToken">Token Callback</Label>
          <div className="flex gap-2">
            <Input
              id="callbackToken"
              value={callbackToken}
              onChange={(e) => setCallbackToken(e.target.value)}
              placeholder="Kosong = callback ditolak"
              className="font-mono"
            />
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setCallbackToken(randomToken())}
            >
              Buat Token
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted">
            Token rahasia ini yang membuktikan callback benar-benar dari provider Anda,
            bukan orang lain yang menebak-nebak URL-nya.
          </p>
        </div>

        {callbackUrl ? (
          <div className="rounded-xl border border-border bg-surface-2 p-3">
            <p className="break-all font-mono text-xs text-brand-cyan">{callbackUrl}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={handleCopyCallbackUrl}
            >
              {copied ? "Tersalin!" : "Salin URL"}
            </Button>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted">
            Isi token callback dulu untuk melihat URL lengkapnya.
          </p>
        )}
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
