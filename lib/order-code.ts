import { randomBytes } from "crypto";

// e.g. NGS-20260813-7F3A9C21E0 (10 hex chars = 40 bits of randomness per day,
// so the public order-lookup endpoints aren't practically brute-forceable).
export function generateOrderCode(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const suffix = randomBytes(5).toString("hex").toUpperCase();
  return `NGS-${y}${m}${d}-${suffix}`;
}
