import { getProviderSettings } from "@/lib/provider";
import { ProviderSettingsForm } from "./ProviderSettingsForm";

export default async function ProviderSettingsPage() {
  const settings = await getProviderSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pengaturan Provider</h1>
        <p className="mt-1 text-sm text-muted">
          Hubungkan NgeStore ke provider top up otomatis (H2H). Kalau belum diisi/
          diaktifkan, semua pesanan tetap diproses manual seperti biasa lewat halaman
          Pesanan.
        </p>
      </div>

      <ProviderSettingsForm
        settings={{
          isEnabled: settings.isEnabled,
          providerName: settings.providerName,
          apiBaseUrl: settings.apiBaseUrl,
          apiUsername: settings.apiUsername,
          apiKey: settings.apiKey,
          requestFormat: settings.requestFormat as "digiflazz" | "bearer_json",
          useMd5Signature: settings.useMd5Signature,
          transactionPin: settings.transactionPin,
          outboundProxyUrl: settings.outboundProxyUrl,
          callbackToken: settings.callbackToken,
          zoneSeparator: settings.zoneSeparator,
        }}
        siteUrl={siteUrl}
      />
    </div>
  );
}
