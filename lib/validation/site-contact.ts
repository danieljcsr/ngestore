import { z } from "zod";

export const siteContactSettingSchema = z.object({
  csWhatsapp: z.string().max(20).nullable().optional(),
  csEmail: z.string().email("Format email tidak valid.").max(200).nullable().optional(),
});
