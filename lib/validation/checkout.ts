import { z } from "zod";

export const checkoutSchema = z.object({
  gameId: z.string().min(1, "Game tidak valid."),
  denominationId: z.string().min(1, "Nominal tidak valid."),
  playerId: z.string().min(1, "ID Player wajib diisi.").max(100, "ID Player terlalu panjang."),
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
