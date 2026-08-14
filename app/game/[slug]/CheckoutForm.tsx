"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/cn";

type GameData = {
  id: string;
  name: string;
  slug: string;
  requiresZoneId: boolean;
  playerIdLabel: string;
  zoneIdLabel: string;
};

type DenominationData = {
  id: string;
  name: string;
  price: number;
  note: string | null;
  isPopular: boolean;
};

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

const SNAP_SRC =
  process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

export function CheckoutForm({
  game,
  denominations,
  maintenanceActive,
  maintenanceMessage,
}: {
  game: GameData;
  denominations: DenominationData[];
  maintenanceActive: boolean;
  maintenanceMessage: string;
}) {
  const router = useRouter();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedDenomination = useMemo(
    () => denominations.find((d) => d.id === selectedId) ?? null,
    [denominations, selectedId],
  );

  const canSubmit =
    !maintenanceActive &&
    !submitting &&
    selectedDenomination !== null &&
    playerId.trim().length > 0 &&
    (!game.requiresZoneId || zoneId.trim().length > 0) &&
    contactName.trim().length >= 2 &&
    contactWhatsapp.trim().length >= 9;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selectedDenomination) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: game.id,
          denominationId: selectedDenomination.id,
          playerId: playerId.trim(),
          zoneId: game.requiresZoneId ? zoneId.trim() : undefined,
          contactName: contactName.trim(),
          contactWhatsapp: contactWhatsapp.trim(),
          contactEmail: contactEmail.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMessage(data?.error ?? "Terjadi kesalahan. Silakan coba lagi.");
        setSubmitting(false);
        return;
      }

      const { orderCode, snapToken } = data as { orderCode: string; snapToken: string };

      const pay = () => {
        if (!window.snap) {
          setErrorMessage(
            "Modul pembayaran belum siap dimuat. Silakan tunggu sebentar lalu coba lagi.",
          );
          setSubmitting(false);
          return;
        }
        window.snap.pay(snapToken, {
          onSuccess: () => {
            router.push(`/order/${orderCode}`);
          },
          onPending: () => {
            router.push(`/order/${orderCode}`);
          },
          onError: () => {
            setErrorMessage(
              "Pembayaran gagal diproses. Pesananmu sudah tercatat, silakan coba bayar lagi atau hubungi admin.",
            );
            setSubmitting(false);
          },
          onClose: () => {
            setSubmitting(false);
          },
        });
      };

      if (window.snap) {
        pay();
      } else {
        // Snap script hasn't finished loading yet — poll briefly for it.
        let attempts = 0;
        const interval = setInterval(() => {
          attempts += 1;
          if (window.snap) {
            clearInterval(interval);
            pay();
          } else if (attempts > 50) {
            clearInterval(interval);
            setErrorMessage(
              "Modul pembayaran gagal dimuat. Periksa koneksi internetmu dan coba lagi.",
            );
            setSubmitting(false);
          }
        }, 100);
      }
    } catch {
      setErrorMessage("Tidak dapat terhubung ke server. Periksa koneksi internetmu.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <Script
        src={SNAP_SRC}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />

      {maintenanceActive && (
        <div className="mb-6 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          {maintenanceMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="p-4 sm:p-5">
            <h2 className="text-base font-semibold text-foreground">Pilih Nominal</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {denominations.map((d) => {
                const active = d.id === selectedId;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedId(d.id)}
                    className={cn(
                      "relative flex flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left transition",
                      active
                        ? "border-brand-indigo bg-brand-indigo/10 ring-2 ring-brand-indigo/40"
                        : "border-border bg-surface-2 hover:border-brand-indigo/50",
                    )}
                  >
                    {d.isPopular && (
                      <span className="absolute -top-2 right-2 rounded-full bg-gradient-gold px-2 py-0.5 text-[10px] font-bold text-background">
                        Populer
                      </span>
                    )}
                    <span className="text-sm font-semibold text-foreground">{d.name}</span>
                    <span className="text-sm font-bold text-brand-cyan">
                      {formatRupiah(d.price)}
                    </span>
                    {d.note && <span className="text-xs text-muted">{d.note}</span>}
                  </button>
                );
              })}
            </div>
            {denominations.length === 0 && (
              <p className="mt-2 text-sm text-muted">
                Belum ada nominal tersedia untuk game ini.
              </p>
            )}
          </Card>

          <Card className="p-4 sm:p-5">
            <h2 className="text-base font-semibold text-foreground">Data Akun</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="playerId">{game.playerIdLabel}</Label>
                <Input
                  id="playerId"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  placeholder={`Masukkan ${game.playerIdLabel}`}
                  required
                />
              </div>
              {game.requiresZoneId && (
                <div>
                  <Label htmlFor="zoneId">{game.zoneIdLabel}</Label>
                  <Input
                    id="zoneId"
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    placeholder={`Masukkan ${game.zoneIdLabel}`}
                    required
                  />
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <h2 className="text-base font-semibold text-foreground">Data Kontak</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="contactName">Nama</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Nama lengkap"
                  required
                />
              </div>
              <div>
                <Label htmlFor="contactWhatsapp">Nomor WhatsApp</Label>
                <Input
                  id="contactWhatsapp"
                  value={contactWhatsapp}
                  onChange={(e) => setContactWhatsapp(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="contactEmail">Email (opsional)</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="nama@email.com"
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4 flex flex-col gap-4 p-4 sm:p-5">
            <h2 className="text-base font-semibold text-foreground">Ringkasan Pesanan</h2>

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>Game</span>
                <span className="text-foreground">{game.name}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Nominal</span>
                <span className="text-foreground">
                  {selectedDenomination ? selectedDenomination.name : "Belum dipilih"}
                </span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-semibold">
                <span className="text-foreground">Total</span>
                <span className="text-brand-cyan">
                  {formatRupiah(selectedDenomination?.price ?? 0)}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {errorMessage}
              </div>
            )}

            <Button type="submit" size="lg" disabled={!canSubmit} className="w-full">
              {maintenanceActive ? "Transaksi Ditutup" : submitting ? "Memproses..." : "Bayar Sekarang"}
            </Button>

            <p className="text-center text-xs text-muted">
              Dengan melanjutkan, kamu setuju pesanan diproses sesuai data yang dimasukkan.
            </p>
          </Card>
        </div>
      </form>
    </>
  );
}
