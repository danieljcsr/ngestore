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
  size = "md",
}: {
  label: string;
  from: string;
  to: string;
  size?: keyof typeof SIZE_CLASSES;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center font-extrabold text-white shadow-lg ${SIZE_CLASSES[size]}`}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {label}
    </div>
  );
}
