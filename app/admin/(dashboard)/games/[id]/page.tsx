import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GameForm } from "@/app/admin/(dashboard)/games/GameForm";
import { GameDenominationsManager } from "@/app/admin/(dashboard)/games/GameDenominationsManager";

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const game = await prisma.game.findUnique({
    where: { id },
    include: { denominations: { orderBy: { sortOrder: "asc" } } },
  });

  if (!game) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Game</h1>
        <p className="mt-1 text-sm text-muted">
          Perbarui data game dan kelola nominal top up di bawah.
        </p>
      </div>
      <GameForm mode="edit" game={game} />
      <GameDenominationsManager gameId={game.id} denominations={game.denominations} />
    </div>
  );
}
