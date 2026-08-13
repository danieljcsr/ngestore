export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "EXPIRED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Menunggu Pembayaran",
  PAID: "Sudah Dibayar",
  PROCESSING: "Sedang Diproses",
  COMPLETED: "Selesai",
  FAILED: "Gagal",
  EXPIRED: "Kedaluwarsa",
  CANCELLED: "Dibatalkan",
};

// Statuses where the top up has been paid but not yet delivered — these are
// what the admin fulfillment queue filters on by default.
export const ACTIONABLE_STATUSES: OrderStatus[] = ["PAID", "PROCESSING"];

// Single source of truth for game/product categories — used by the admin
// create/edit form, the /games filter tabs, and the zod validation schemas,
// so adding a category never means hunting down multiple duplicated lists.
export const GAME_CATEGORIES = ["Mobile Game", "PC Game", "Voucher", "PPOB"] as const;

export type GameCategory = (typeof GAME_CATEGORIES)[number];

export const BADGE_GRADIENTS = [
  ["#8B5CF6", "#6366F1"],
  ["#6366F1", "#06B6D4"],
  ["#F59E0B", "#EF4444"],
  ["#06B6D4", "#22C55E"],
  ["#EC4899", "#8B5CF6"],
  ["#F59E0B", "#FDE047"],
] as const;
