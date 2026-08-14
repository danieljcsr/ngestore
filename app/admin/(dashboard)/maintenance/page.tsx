import { getMaintenanceSettings } from "@/lib/maintenance";
import { MaintenanceSettingsForm } from "./MaintenanceSettingsForm";

export default async function MaintenanceSettingsPage() {
  const settings = await getMaintenanceSettings();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Jam Operasional</h1>
        <p className="mt-1 text-sm text-muted">
          Tutup transaksi otomatis di jam tertentu setiap hari (waktu WIB). Kalau
          dimatikan, situs menerima transaksi 24 jam seperti biasa.
        </p>
      </div>

      <MaintenanceSettingsForm
        settings={{
          isEnabled: settings.isEnabled,
          startTime: settings.startTime,
          endTime: settings.endTime,
          message: settings.message,
        }}
      />
    </div>
  );
}
