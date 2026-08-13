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
});
