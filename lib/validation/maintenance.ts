import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const maintenanceSettingSchema = z.object({
  isEnabled: z.boolean().optional(),
  startTime: z.string().regex(timePattern, "Format jam harus HH:mm, misal 23:00.").optional(),
  endTime: z.string().regex(timePattern, "Format jam harus HH:mm, misal 01:00.").optional(),
  message: z.string().max(300).nullable().optional(),
});
