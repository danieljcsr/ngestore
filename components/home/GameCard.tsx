import Link from "next/link";

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
      className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-border shadow-lg transition duration-300 hover:-translate-y-1 hover:border-brand-indigo/60 hover:shadow-xl hover:shadow-brand-indigo/20"
    >
      {imageUrl ? (
        // Plain <img>, not next/image: this is an external, admin-uploaded file whose
        // Vercel Blob hostname is per-store (random subdomain), so it can't be
        // allowlisted in next.config.ts ahead of time.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundImage: `linear-gradient(135deg, ${badgeFrom}, ${badgeTo})` }}
        >
          <span className="select-none text-5xl font-extrabold text-white/25 sm:text-6xl">
            {badgeLabel}
          </span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <h3 className="truncate text-sm font-bold text-white sm:text-base">{name}</h3>
        <p className="truncate text-xs text-white/70">{category}</p>
      </div>
    </Link>
  );
}
