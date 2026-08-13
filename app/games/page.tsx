import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { GameCard } from "@/components/home/GameCard";
import { GameSearchBar } from "@/components/home/GameSearchBar";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { GAME_CATEGORIES, type GameCategory } from "@/lib/types";

export const metadata: Metadata = {
  title: "Semua Game",
  description: "Jelajahi semua game yang tersedia untuk top up di NgeStore.",
};

function isCategory(value: string | undefined): value is GameCategory {
  return !!value && (GAME_CATEGORIES as readonly string[]).includes(value);
}

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category: rawCategory } = await searchParams;
  const query = q?.trim() ?? "";
  const category = isCategory(rawCategory) ? rawCategory : undefined;

  const games = await prisma.game.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
    },
    orderBy: { sortOrder: "asc" },
    include: {
      denominations: {
        where: { isActive: true },
        select: { price: true },
      },
    },
  });

  // Filtered in application code rather than via Prisma's `contains` so search is
  // reliably case-insensitive on every database provider — Postgres (production)
  // requires an explicit `mode: "insensitive"` that SQLite (local dev) doesn't
  // support, so a DB-level filter would silently behave differently in each place.
  const normalizedQuery = query.toLowerCase();
  const matchedGames = normalizedQuery
    ? games.filter((game) => game.name.toLowerCase().includes(normalizedQuery))
    : games;

  const gameCards = matchedGames.map((game) => {
    const prices = game.denominations.map((d) => d.price);
    return {
      slug: game.slug,
      name: game.name,
      category: game.category,
      badgeLabel: game.badgeLabel,
      badgeFrom: game.badgeFrom,
      badgeTo: game.badgeTo,
      imageUrl: game.imageUrl,
      startingPrice: prices.length > 0 ? Math.min(...prices) : null,
    };
  });

  const tabs: { label: string; value: string | undefined }[] = [
    { label: "Semua", value: undefined },
    ...GAME_CATEGORIES.map((c) => ({ label: c, value: c })),
  ];

  function tabHref(value: string | undefined) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (value) params.set("category", value);
    const qs = params.toString();
    return qs ? `/games?${qs}` : "/games";
  }

  return (
    <Container className="py-10 sm:py-14">
      <div className="mb-8 text-center sm:mb-10">
        <h1 className="font-display text-4xl font-bold uppercase tracking-wide text-foreground sm:text-5xl">
          Semua <span className="text-gradient-brand">Game</span>
        </h1>
        <p className="mt-2 text-sm text-muted sm:text-base">
          Cari dan pilih game yang ingin kamu top up.
        </p>
      </div>

      <div className="mx-auto mb-6 max-w-xl">
        <GameSearchBar defaultValue={query} />
      </div>

      <nav aria-label="Filter kategori" className="mb-8 flex flex-wrap justify-center gap-2">
        {tabs.map((tab) => {
          const isActive = tab.value === category;
          return (
            <Link
              key={tab.label}
              href={tabHref(tab.value)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition",
                isActive
                  ? "border-transparent bg-gradient-brand text-white shadow-lg shadow-brand-indigo/25"
                  : "border-border bg-surface-2 text-muted hover:border-brand-indigo/50 hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {gameCards.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {gameCards.map((game) => (
            <GameCard key={game.slug} {...game} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm font-medium text-foreground sm:text-base">
            Game tidak ditemukan.
          </p>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Coba kata kunci lain atau pilih kategori berbeda.
          </p>
        </div>
      )}
    </Container>
  );
}
