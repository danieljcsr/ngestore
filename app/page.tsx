import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Hero } from "@/components/home/Hero";
import { GameCard } from "@/components/home/GameCard";
import { HowItWorks } from "@/components/home/HowItWorks";
import { prisma } from "@/lib/prisma";

// Without this, Next.js prerenders the homepage once at build time (it has no
// per-request input like searchParams/cookies to force dynamic rendering) and
// then serves that snapshot forever — so admin changes (new photo, featured
// toggle, price) would never appear here until the next deploy, even though
// every other catalog page (/games, /game/[slug]) already queries fresh.
export const dynamic = "force-dynamic";

export default async function Home() {
  const featuredGames = await prisma.game.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: { sortOrder: "asc" },
    include: {
      denominations: {
        where: { isActive: true },
        select: { price: true },
      },
    },
  });

  const games = featuredGames.map((game) => {
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

  return (
    <Container>
      <Hero />

      <section aria-labelledby="popular-games-heading" className="py-8 sm:py-12">
        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
          <div>
            <h2
              id="popular-games-heading"
              className="text-2xl font-bold text-foreground sm:text-3xl"
            >
              Game Populer
            </h2>
            <p className="mt-1 text-sm text-muted">
              Game paling banyak di top up minggu ini.
            </p>
          </div>
          <Button href="/games" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Lihat Semua
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {games.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {games.map((game) => (
              <GameCard key={game.slug} {...game} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
            Belum ada game unggulan saat ini.
          </p>
        )}
      </section>

      <HowItWorks />

      <section className="my-8 rounded-3xl bg-gradient-brand p-8 text-center sm:my-12 sm:p-12">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Nggak nemu game kamu di atas?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/85 sm:text-base">
          Jelajahi katalog lengkap kami dan temukan game favoritmu sekarang.
        </p>
        <Button
          href="/games"
          variant="secondary"
          size="lg"
          className="mt-6 border-white/30 bg-white text-brand-indigo hover:bg-white/90"
        >
          Lihat Semua Game
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </section>
    </Container>
  );
}
