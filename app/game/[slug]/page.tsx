import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { GameIcon } from "@/components/ui/GameIcon";
import { CheckoutForm } from "./CheckoutForm";

export default async function GameDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  const game = await prisma.game.findUnique({
    where: { slug },
    include: {
      denominations: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!game || !game.isActive) {
    notFound();
  }

  const gameData = {
    id: game.id,
    name: game.name,
    slug: game.slug,
    requiresZoneId: game.requiresZoneId,
    playerIdLabel: game.playerIdLabel,
    zoneIdLabel: game.zoneIdLabel,
  };

  const denominations = game.denominations.map((d) => ({
    id: d.id,
    name: d.name,
    price: d.price,
    note: d.note,
    isPopular: d.isPopular,
  }));

  return (
    <Container className="py-8 sm:py-12">
      <div className="flex items-center gap-4 sm:gap-5">
        <GameIcon
          label={game.badgeLabel}
          from={game.badgeFrom}
          to={game.badgeTo}
          imageUrl={game.imageUrl}
          alt={game.name}
          size="xl"
        />
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{game.name}</h1>
          <p className="mt-1 text-sm text-muted">{game.category}</p>
        </div>
      </div>

      {game.instructions && (
        <Card className="mt-6 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-brand-cyan">Cara Menemukan ID Kamu</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
            {game.instructions}
          </p>
        </Card>
      )}

      <div className="mt-8">
        <CheckoutForm game={gameData} denominations={denominations} />
      </div>
    </Container>
  );
}
