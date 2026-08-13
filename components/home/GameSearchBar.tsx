import { Search } from "lucide-react";

export function GameSearchBar({
  defaultValue,
  className,
}: {
  defaultValue?: string;
  className?: string;
}) {
  return (
    <form
      action="/games"
      method="get"
      role="search"
      className={`flex w-full items-center gap-2 rounded-2xl border border-border bg-surface-2/80 p-2 shadow-lg shadow-black/20 backdrop-blur ${className ?? ""}`}
    >
      <label htmlFor="game-search-q" className="sr-only">
        Cari game
      </label>
      <Search className="ml-2 h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
      <input
        id="game-search-q"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Cari game favoritmu, misalnya Mobile Legends..."
        className="w-full bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted sm:text-base"
      />
      <button
        type="submit"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-indigo/25 transition hover:brightness-110 active:brightness-95 sm:px-6"
      >
        Cari
      </button>
    </form>
  );
}
