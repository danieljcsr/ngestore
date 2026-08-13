const SIZE_CLASSES = {
  sm: "h-10 w-10 text-sm rounded-lg",
  md: "h-14 w-14 text-base rounded-xl",
  lg: "h-20 w-20 text-xl rounded-2xl",
  xl: "h-28 w-28 text-3xl rounded-2xl",
} as const;

export function GameIcon({
  label,
  from,
  to,
  imageUrl,
  alt,
  size = "md",
}: {
  label: string;
  from: string;
  to: string;
  imageUrl?: string | null;
  alt?: string;
  size?: keyof typeof SIZE_CLASSES;
}) {
  if (imageUrl) {
    // Plain <img>, not next/image: this is an external, admin-uploaded file whose
    // Vercel Blob hostname is per-store (random subdomain), so it can't be
    // allowlisted in next.config.ts ahead of time.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={alt ?? label}
        className={`shrink-0 object-cover shadow-lg ${SIZE_CLASSES[size]}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center font-extrabold text-white shadow-lg ${SIZE_CLASSES[size]}`}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {label}
    </div>
  );
}
