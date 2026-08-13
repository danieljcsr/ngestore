import { Gamepad2, IdCard, CreditCard, Sparkles } from "lucide-react";

const STEPS = [
  {
    icon: Gamepad2,
    title: "Pilih Game",
    description: "Cari dan pilih game yang ingin kamu top up dari katalog kami.",
  },
  {
    icon: IdCard,
    title: "Masukkan ID",
    description: "Isi User ID (dan Zone ID jika perlu) serta pilih nominal top up.",
  },
  {
    icon: CreditCard,
    title: "Bayar",
    description: "Selesaikan pembayaran lewat QRIS, e-wallet, atau transfer bank.",
  },
  {
    icon: Sparkles,
    title: "Diamond Masuk Otomatis",
    description: "Pesananmu diproses otomatis dan langsung masuk ke akun game.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading" className="py-12 sm:py-16">
      <div className="mb-8 text-center sm:mb-12">
        <h2
          id="how-it-works-heading"
          className="text-2xl font-bold text-foreground sm:text-3xl"
        >
          Cara Top Up di <span className="text-gradient-brand">NgeStore</span>
        </h2>
        <p className="mt-2 text-sm text-muted sm:text-base">
          Cuma 4 langkah, top up beres dalam hitungan menit.
        </p>
      </div>

      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, description }, index) => (
          <li key={title} className="card-surface relative rounded-2xl p-5">
            <span className="absolute right-4 top-4 text-3xl font-extrabold text-foreground/10">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-white">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="text-sm font-semibold text-foreground sm:text-base">
              {title}
            </h3>
            <p className="mt-1.5 text-xs text-muted sm:text-sm">{description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
