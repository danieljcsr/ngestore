import { randomBytes } from "crypto";

// e.g. NGS-20260813-7F3K9A
export function generateOrderCode(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const suffix = randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  return `NGS-${y}${m}${d}-${suffix}`;
}
