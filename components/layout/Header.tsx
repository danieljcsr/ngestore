"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/games", label: "Semua Game" },
  { href: "/track", label: "Lacak Pesanan" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2" onClick={() => setOpen(false)}>
          <Image
            src="/logo/ngestore-logo-dark.svg"
            alt="NgeStore"
            width={140}
            height={40}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-white/5 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/games"
            aria-label="Cari game"
            className="rounded-lg p-2.5 text-foreground/80 transition hover:bg-white/5 hover:text-foreground"
          >
            <Search size={18} />
          </Link>
          <Button href="/games" size="sm">
            Top Up Sekarang
          </Button>
        </div>

        <button
          className="rounded-lg p-2 text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Buka menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </Container>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-white/5 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <Button href="/games" size="sm" className="mt-2 w-full">
              Top Up Sekarang
            </Button>
          </Container>
        </div>
      )}
    </header>
  );
}
