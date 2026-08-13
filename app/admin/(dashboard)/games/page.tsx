import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { GameIcon } from "@/components/ui/GameIcon";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export default async function AdminGamesPage() {
  const games = await prisma.game.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { denominations: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kelola Game</h1>
          <p className="mt-1 text-sm text-muted">
            Daftar game beserta nominal top up yang tersedia di toko.
          </p>
        </div>
        <Button href="/admin/games/new">Tambah Game</Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">Game</th>
                <th className="px-4 py-3 font-semibold">Kategori</th>
                <th className="px-4 py-3 font-semibold">Nominal</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Ditampilkan</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game.id} className="border-b border-border/60 last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <GameIcon
                        label={game.badgeLabel}
                        from={game.badgeFrom}
                        to={game.badgeTo}
                        imageUrl={game.imageUrl}
                        alt={game.name}
                        size="sm"
                      />
                      <div>
                        <p className="font-semibold text-foreground">{game.name}</p>
                        <p className="text-xs text-muted">{game.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{game.category}</td>
                  <td className="px-4 py-3 text-muted">{game._count.denominations}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                        game.isActive
                          ? "border-success/30 bg-success/15 text-success"
                          : "border-muted/30 bg-muted/15 text-muted",
                      )}
                    >
                      {game.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                        game.isFeatured
                          ? "border-brand-gold/30 bg-brand-gold/15 text-brand-gold"
                          : "border-muted/30 bg-muted/15 text-muted",
                      )}
                    >
                      {game.isFeatured ? "Beranda" : "Tidak"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={"/admin/games/" + game.id}
                      className="font-semibold text-brand-cyan hover:underline"
                    >
                      Kelola
                    </Link>
                  </td>
                </tr>
              ))}
              {games.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    Belum ada game. Klik &ldquo;Tambah Game&rdquo; untuk menambahkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
