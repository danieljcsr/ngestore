import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const orderUpdateSchema = z.object({
  status: z
    .enum([
      "PENDING_PAYMENT",
      "PAID",
      "PROCESSING",
      "COMPLETED",
      "FAILED",
      "EXPIRED",
      "CANCELLED",
    ])
    .optional(),
  adminNote: z.string().max(500).optional(),
  // Manual override for the delivered voucher/serial code — a provider bug
  // (or a stale callback recorded before a parsing fix) can leave the wrong
  // value here, and there's no other way to correct it after the fact.
  providerTrxId: z.string().max(200).nullable().optional(),
});
