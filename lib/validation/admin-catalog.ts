import { z } from "zod";

export const gameCreateSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung."),
  category: z.enum(["Mobile Game", "PC Game", "Voucher"]),
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

export const gameUpdateSchema = gameCreateSchema.partial();

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
