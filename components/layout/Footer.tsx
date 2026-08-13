"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Zap, Headset } from "lucide-react";
import { Container } from "@/components/ui/Container";

const FOOTER_LINKS = [
  {
    title: "NgeStore",
    links: [
      { href: "/", label: "Beranda" },
      { href: "/games", label: "Semua Game" },
      { href: "/track", label: "Lacak Pesanan" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="mt-24 border-t border-border">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Image
            src="/logo/ngestore-logo-dark.svg"
            alt="NgeStore"
            width={140}
            height={40}
            className="h-9 w-auto"
          />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Top up diamond, UC, dan voucher game favoritmu. Proses cepat, harga bersahabat,
            pembayaran aman lewat QRIS, e-wallet, dan transfer bank.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-success" /> Pembayaran Aman
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap size={15} className="text-brand-gold" /> Proses Cepat
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Headset size={15} className="text-brand-cyan" /> CS Siap Bantu
            </span>
          </div>
        </div>

        {FOOTER_LINKS.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="text-sm font-semibold text-foreground">Metode Pembayaran</h3>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            QRIS, transfer bank, dan e-wallet — diproses aman melalui Midtrans.
          </p>
        </div>
      </Container>

      <div className="border-t border-border py-6">
        <Container className="flex flex-col items-center justify-between gap-2 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} NgeStore. Seluruh hak cipta dilindungi.</p>
          <p>ngestore.id</p>
        </Container>
      </div>
    </footer>
  );
}
