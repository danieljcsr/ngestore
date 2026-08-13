import { GameForm } from "@/app/admin/(dashboard)/games/GameForm";

export default function NewGamePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tambah Game</h1>
        <p className="mt-1 text-sm text-muted">
          Isi data game baru. Nominal top up dapat ditambahkan setelah game dibuat.
        </p>
      </div>
      <GameForm mode="create" />
    </div>
  );
}
