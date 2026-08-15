import { z } from "zod";

export const bannerCreateSchema = z.object({
  imageUrl: z.string().url("URL gambar tidak valid.").max(500),
  linkUrl: z.string().max(500).nullable().optional(),
  altText: z.string().max(150).optional(),
  isActive: z.boolean().optional().default(true),
});

// Deliberately no defaults — same "absent key = leave unchanged" convention
// as gameUpdateSchema/providerSettingSchema.
export const bannerUpdateSchema = z.object({
  imageUrl: z.string().url("URL gambar tidak valid.").max(500).optional(),
  linkUrl: z.string().max(500).nullable().optional(),
  altText: z.string().max(150).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});
