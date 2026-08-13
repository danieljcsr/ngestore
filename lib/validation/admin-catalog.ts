import { z } from "zod";
import { GAME_CATEGORIES } from "@/lib/types";

export const gameCreateSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung."),
  category: z.enum(GAME_CATEGORIES),
  badgeLabel: z.string().min(1).max(6),
  badgeFrom: z.string().min(4).max(9),
  badgeTo: z.string().min(4).max(9),
  // Absent key = leave unchanged (on update), null = clear back to the generated
  // badge icon, string = the uploaded image URL.
  imageUrl: z.string().url().max(500).nullable().optional(),
  requiresZoneId: z.boolean().optional().default(false),
  playerIdLabel: z.string().min(1).max(50).optional(),
  zoneIdLabel: z.string().min(1).max(50).optional(),
  instructions: z.string().max(2000).optional(),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

// Deliberately NOT `gameCreateSchema.partial()`: partial() keeps each field's
// `.default(...)`, and Zod applies that default whenever the key is absent from
// the input — so an update payload that simply omits e.g. isFeatured would have
// silently reset it to false instead of leaving it unchanged. This schema has no
// defaults at all, so an absent key parses as true `undefined`, matching the
// "absent = leave unchanged" convention the PATCH routes rely on.
export const gameUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung.")
    .optional(),
  category: z.enum(GAME_CATEGORIES).optional(),
  badgeLabel: z.string().min(1).max(6).optional(),
  badgeFrom: z.string().min(4).max(9).optional(),
  badgeTo: z.string().min(4).max(9).optional(),
  imageUrl: z.string().url().max(500).nullable().optional(),
  requiresZoneId: z.boolean().optional(),
  playerIdLabel: z.string().min(1).max(50).optional(),
  zoneIdLabel: z.string().min(1).max(50).optional(),
  instructions: z.string().max(2000).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const denominationCreateSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.coerce.number().int().positive(),
  note: z.string().max(200).optional(),
  isPopular: z.boolean().optional().default(false),
});

export const denominationUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  price: z.coerce.number().int().positive().optional(),
  note: z.string().max(200).optional(),
  isActive: z.boolean().optional(),
  isPopular: z.boolean().optional(),
});
