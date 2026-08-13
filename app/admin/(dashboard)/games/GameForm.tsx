"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GameIcon } from "@/components/ui/GameIcon";
import { Input, Label, Textarea } from "@/components/ui/Input";

type GameData = {
  id: string;
  name: string;
  slug: string;
  category: string;
  badgeLabel: string;
  badgeFrom: string;
  badgeTo: string;
  requiresZoneId: boolean;
  playerIdLabel: string;
  zoneIdLabel: string;
  instructions: string | null;
  isFeatured: boolean;
  isActive: boolean;
};

type Props =
  | { mode: "create"; game?: undefined }
  | { mode: "edit"; game: GameData };

const CATEGORY_OPTIONS = ["Mobile Game", "PC Game", "Voucher"] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type FieldErrors = Record<string, string[] | undefined>;

export function GameForm({ mode, game }: Props) {
  const router = useRouter();
  const [name, setName] = useState(game?.name ?? "");
  const [slug, setSlug] = useState(game?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [category, setCategory] = useState<string>(game?.category ?? CATEGORY_OPTIONS[0]);
  const [badgeLabel, setBadgeLabel] = useState(game?.badgeLabel ?? "");
  const [badgeFrom, setBadgeFrom] = useState(game?.badgeFrom ?? "#8B5CF6");
  const [badgeTo, setBadgeTo] = useState(game?.badgeTo ?? "#6366F1");
  const [requiresZoneId, setRequiresZoneId] = useState(game?.requiresZoneId ?? false);
  const [playerIdLabel, setPlayerIdLabel] = useState(game?.playerIdLabel ?? "User ID");
  const [zoneIdLabel, setZoneIdLabel] = useState(game?.zoneIdLabel ?? "Zone ID");
  const [instructions, setInstructions] = useState(game?.instructions ?? "");
  const [isFeatured, setIsFeatured] = useState(game?.isFeatured ?? false);
  const [isActive, setIsActive] = useState(game?.isActive ?? true);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function fieldError(key: string) {
    const messages = fieldErrors[key];
    if (!messages || messages.length === 0) return null;
    return messages[0];
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const payload = {
      name,
      slug,
      category,
      badgeLabel,
      badgeFrom,
      badgeTo,
      requiresZoneId,
      // Send the field as typed (even if empty) rather than coercing "" to undefined:
      // undefined means "leave unchanged" to the API, so coercing would make clearing
      // a field in the edit form silently no-op instead of either clearing it
      // (instructions, which is nullable) or surfacing a validation error (the two
      // labels, which are required — the API will reject an empty value with a
      // proper inline field error instead of quietly keeping the stale one).
      playerIdLabel,
      zoneIdLabel,
      instructions,
      isFeatured,
      isActive,
    };

    try {
      const url = mode === "create" ? "/api/admin/games" : "/api/admin/games/" + game.id;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setFormError(result?.error ?? "Terjadi kesalahan. Silakan coba lagi.");
        if (result?.issues) {
          setFieldErrors(result.issues as FieldErrors);
        }
        setSubmitting(false);
        return;
      }

      if (mode === "create") {
        router.push("/admin/games/" + result.id);
      } else {
        router.refresh();
        setSubmitting(false);
      }
    } catch {
      setFormError("Tidak dapat menghubungi server. Periksa koneksi Anda.");
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {formError}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Nama Game</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              maxLength={100}
            />
            {fieldError("name") && (
              <p className="mt-1 text-xs text-danger">{fieldError("name")}</p>
            )}
          </div>

          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              required
              maxLength={100}
            />
            {fieldError("slug") && (
              <p className="mt-1 text-xs text-danger">{fieldError("slug")}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="category">Kategori</Label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/30"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {fieldError("category") && (
            <p className="mt-1 text-xs text-danger">{fieldError("category")}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-[auto_1fr_1fr]">
          <div className="flex flex-col items-center gap-2">
            <Label>Pratinjau</Label>
            <GameIcon label={badgeLabel || "?"} from={badgeFrom || "#8B5CF6"} to={badgeTo || "#6366F1"} size="lg" />
          </div>
          <div>
            <Label htmlFor="badgeLabel">Label Badge</Label>
            <Input
              id="badgeLabel"
              value={badgeLabel}
              onChange={(e) => setBadgeLabel(e.target.value)}
              required
              maxLength={6}
              placeholder="ML"
            />
            <p className="mt-1 text-xs text-muted">Maksimal sekitar 5 karakter, misal &ldquo;ML&rdquo;.</p>
            {fieldError("badgeLabel") && (
              <p className="mt-1 text-xs text-danger">{fieldError("badgeLabel")}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="badgeFrom">Warna Dari</Label>
              <Input
                id="badgeFrom"
                value={badgeFrom}
                onChange={(e) => setBadgeFrom(e.target.value)}
                required
                placeholder="#8B5CF6"
              />
              {fieldError("badgeFrom") && (
                <p className="mt-1 text-xs text-danger">{fieldError("badgeFrom")}</p>
              )}
            </div>
            <div>
              <Label htmlFor="badgeTo">Warna Ke</Label>
              <Input
                id="badgeTo"
                value={badgeTo}
                onChange={(e) => setBadgeTo(e.target.value)}
                required
                placeholder="#6366F1"
              />
              {fieldError("badgeTo") && (
                <p className="mt-1 text-xs text-danger">{fieldError("badgeTo")}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="requiresZoneId"
            type="checkbox"
            checked={requiresZoneId}
            onChange={(e) => setRequiresZoneId(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-surface-2 accent-brand-indigo"
          />
          <Label htmlFor="requiresZoneId" className="mb-0">
            Wajib isi Zone ID?
          </Label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="playerIdLabel">Label Player ID</Label>
            <Input
              id="playerIdLabel"
              value={playerIdLabel}
              onChange={(e) => setPlayerIdLabel(e.target.value)}
              maxLength={50}
              placeholder="User ID"
            />
            {fieldError("playerIdLabel") && (
              <p className="mt-1 text-xs text-danger">{fieldError("playerIdLabel")}</p>
            )}
          </div>
          {requiresZoneId && (
            <div>
              <Label htmlFor="zoneIdLabel">Label Zone ID</Label>
              <Input
                id="zoneIdLabel"
                value={zoneIdLabel}
                onChange={(e) => setZoneIdLabel(e.target.value)}
                maxLength={50}
                placeholder="Zone ID"
              />
              {fieldError("zoneIdLabel") && (
                <p className="mt-1 text-xs text-danger">{fieldError("zoneIdLabel")}</p>
              )}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="instructions">Instruksi (opsional)</Label>
          <Textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Contoh: Cara menemukan User ID dan Zone ID di dalam game."
          />
          {fieldError("instructions") && (
            <p className="mt-1 text-xs text-danger">{fieldError("instructions")}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <input
              id="isFeatured"
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-border bg-surface-2 accent-brand-indigo"
            />
            <Label htmlFor="isFeatured" className="mb-0">
              Ditampilkan di beranda?
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border bg-surface-2 accent-brand-indigo"
            />
            <Label htmlFor="isActive" className="mb-0">
              Aktif?
            </Label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Menyimpan..." : mode === "create" ? "Buat Game" : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
