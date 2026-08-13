import Link from "next/link";
import { GameIcon } from "@/components/ui/GameIcon";

export type GameCardProps = {
  slug: string;
  name: string;
  category: string;
  badgeLabel: string;
  badgeFrom: string;
  badgeTo: string;
  imageUrl?: string | null;
};

export function GameCard({
  slug,
  name,
  category,
  badgeLabel,
  badgeFrom,
  badgeTo,
  imageUrl,
}: GameCardProps) {
  return (
    <Link
      href={`/game/${slug}`}
      className="card-surface group flex flex-col items-center gap-3 rounded-2xl p-4 text-center transition hover:-translate-y-1 hover:border-brand-indigo/60 hover:shadow-lg hover:shadow-brand-indigo/10 sm:p-5"
    >
      <GameIcon label={badgeLabel} from={badgeFrom} to={badgeTo} imageUrl={imageUrl} alt={name} size="lg" />
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">
          {name}
        </h3>
        <p className="text-xs text-muted">{category}</p>
      </div>
    </Link>
  );
}
