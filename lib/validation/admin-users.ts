import { z } from "zod";

export const adminUserCreateSchema = z.object({
  email: z.string().email("Format email tidak valid.").max(200),
  name: z.string().min(2, "Nama minimal 2 karakter.").max(100),
  password: z.string().min(8, "Password minimal 8 karakter."),
  role: z.string().min(2, "Peran minimal 2 karakter.").max(50),
});

// Deliberately no defaults, same "absent key = leave unchanged" convention as
// gameUpdateSchema/providerSettingSchema — password is optional here so an
// edit that doesn't touch it never resets it.
export const adminUserUpdateSchema = z.object({
  email: z.string().email("Format email tidak valid.").max(200).optional(),
  name: z.string().min(2, "Nama minimal 2 karakter.").max(100).optional(),
  password: z.string().min(8, "Password minimal 8 karakter.").optional(),
  role: z.string().min(2, "Peran minimal 2 karakter.").max(50).optional(),
});
