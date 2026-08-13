import { ShieldCheck, Zap, Users } from "lucide-react";
import { GameSearchBar } from "@/components/home/GameSearchBar";

const TRUST_INDICATORS = [
  {
    icon: Zap,
    label: "Proses Kilat",
    description: "Diamond & UC masuk otomatis dalam hitungan menit",
  },
  {
    icon: ShieldCheck,
    label: "Pembayaran Aman",
    description: "QRIS, e-wallet, dan transfer bank terenkripsi",
  },
  {
    icon: Users,
    label: "Ribuan Pemain",
    description: "Dipercaya gamer di seluruh Indonesia",
  },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-indigo/30 blur-3xl sm:h-[28rem] sm:w-[28rem]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-20 right-[-4rem] h-64 w-64 rounded-full bg-brand-cyan/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-40 left-[-4rem] h-64 w-64 rounded-full bg-brand-purple/20 blur-3xl"
      />

      <div className="relative flex flex-col items-center gap-8 py-16 text-center sm:py-24">
        <h1 className="max-w-3xl text-balance text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl sm:leading-tight">
          Top Up Game{" "}
          <span className="text-gradient-brand">Cepat, Murah &amp; Aman</span>{" "}
          Cuma di NgeStore
        </h1>
        <p className="max-w-xl text-balance text-sm text-muted sm:text-lg">
          Isi ulang Diamond, UC, dan voucher game favoritmu dalam hitungan
          menit. Tanpa ribet, tanpa antre, harga bersahabat buat semua kalangan gamer.
        </p>

        <div className="w-full max-w-xl">
          <GameSearchBar />
        </div>

        <dl className="mt-4 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {TRUST_INDICATORS.map(({ icon: Icon, label, description }) => (
            <div
              key={label}
              className="card-surface flex items-center gap-3 rounded-2xl p-4 text-left sm:flex-col sm:items-start sm:gap-2"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <dt className="text-sm font-semibold text-foreground">{label}</dt>
                <dd className="text-xs text-muted">{description}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
