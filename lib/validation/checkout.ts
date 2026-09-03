import { z } from "zod";

export const checkoutSchema = z.object({
  gameId: z.string().min(1, "Game tidak valid."),
  denominationId: z.string().min(1, "Nominal tidak valid."),
  // Required-ness depends on the game (Game.requiresPlayerId) and is enforced
  // in the checkout route, same pattern as zoneId below — pure voucher
  // products don't have a player destination at all.
  playerId: z.string().max(100, "ID Player terlalu panjang.").optional(),
  zoneId: z.string().optional(),
  contactName: z
    .string()
    .min(2, "Nama minimal 2 karakter.")
    .max(100, "Nama terlalu panjang."),
  contactWhatsapp: z
    .string()
    .min(9, "Nomor WhatsApp minimal 9 digit.")
    .max(20, "Nomor WhatsApp terlalu panjang."),
  contactEmail: z
    .string()
    .email("Format email tidak valid.")
    .optional()
    .or(z.literal("")),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
