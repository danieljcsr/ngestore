import { z } from "zod";

// All fields optional/no-default by design: an admin only sends the fields
// they're changing, and every other field must stay untouched (see the
// gameUpdateSchema comment in admin-catalog.ts for why `.default(...)` here
// would silently reset omitted fields instead of leaving them alone).
export const providerSettingSchema = z.object({
  isEnabled: z.boolean().optional(),
  providerName: z.string().min(1).max(100).optional(),
  apiBaseUrl: z.string().url().max(500).nullable().optional(),
  apiUsername: z.string().max(200).nullable().optional(),
  apiKey: z.string().max(500).nullable().optional(),
  requestFormat: z.enum(["digiflazz", "bearer_json"]).optional(),
  useMd5Signature: z.boolean().optional(),
  transactionPin: z.string().max(50).nullable().optional(),
  outboundProxyUrl: z.string().url().max(500).nullable().optional(),
  callbackToken: z.string().max(200).nullable().optional(),
  zoneSeparator: z.string().max(10).optional(),
});
