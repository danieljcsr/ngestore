import { getSiteContactSettings } from "@/lib/site-contact";
import { ContactSettingsForm } from "./ContactSettingsForm";

export default async function ContactSettingsPage() {
  const settings = await getSiteContactSettings();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kontak & Customer Service</h1>
        <p className="mt-1 text-sm text-muted">
          Nomor WhatsApp dan email ini ditampilkan di footer situs supaya pelanggan bisa
          menghubungi Anda. Kosongkan untuk menyembunyikannya dari footer.
        </p>
      </div>

      <ContactSettingsForm
        settings={{
          csWhatsapp: settings.csWhatsapp,
          csEmail: settings.csEmail,
        }}
      />
    </div>
  );
}
