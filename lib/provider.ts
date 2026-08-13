import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

// Talks to whatever automatic top-up supplier (H2H provider) the store owner
// configures from /admin/settings — this is deliberately generic rather than
// tied to one named provider, since the exact provider isn't chosen yet.
//
// The request shape (username + buyer_sku_code + customer_no + ref_id[+sign])
// and the "Sukses / Pending / Gagal" status vocabulary match Digiflazz, which
// is both the most common H2H provider in Indonesia and the API shape many
// smaller/reseller panels clone outright. If the eventual provider differs,
// this file — buildRequestBody(), parseProviderResponse(), classifyStatus()
// — is the isolated place to adjust; nothing outside lib/provider.ts needs to
// change.

export type ProviderDispatchOutcome =
  | "success"
  | "pending"
  | "failed"
  | "not_configured"
  | "error";

export type ProviderDispatchResult = {
  outcome: ProviderDispatchOutcome;
  message?: string;
  trxId?: string;
};

export async function getProviderSettings() {
  const existing = await prisma.providerSetting.findFirst();
  if (existing) return existing;
  return prisma.providerSetting.create({ data: {} });
}

function buildSignature(username: string, apiKey: string, refId: string): string {
  return createHash("md5").update(`${username}${apiKey}${refId}`).digest("hex");
}

// Digiflazz's own convention for games that need a server/zone id (e.g.
// Mobile Legends) is "<user_id> <zone_id>" — space separated. Some specific
// products deviate from this; adjust here if your provider needs something
// else for a given SKU.
function buildCustomerNo(playerId: string, zoneId: string | null): string {
  return zoneId ? `${playerId} ${zoneId}` : playerId;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function firstString(record: UnknownRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) return value;
    if (typeof value === "number") return String(value);
  }
  return null;
}

function parseProviderResponse(body: unknown): {
  status: string | null;
  message: string | null;
  trxId: string | null;
} {
  const root = asRecord(body);
  // Digiflazz-style responses nest everything under `data`; plenty of clone
  // APIs flatten it to the top level — check both.
  const data = asRecord(root.data ?? root);
  return {
    status: firstString(data, ["status", "transaction_status", "result"]),
    message: firstString(data, ["message", "msg", "description"]),
    trxId: firstString(data, ["trx_id", "sn", "transaction_id", "ref_id"]),
  };
}

function classifyStatus(status: string | null): "success" | "pending" | "failed" | "unknown" {
  if (!status) return "unknown";
  const normalized = status.toLowerCase();
  if (["sukses", "success", "completed", "sccs"].includes(normalized)) return "success";
  if (["gagal", "failed", "error", "cancel", "canceled", "cancelled"].includes(normalized)) {
    return "failed";
  }
  if (["pending", "processing", "diproses", "process"].includes(normalized)) return "pending";
  return "unknown";
}

// Sends a PAID order to the configured supplier. Always resolves (never
// throws) — a misconfigured or unreachable provider must never break the
// order/payment flow around it. When no provider is configured yet, this is
// a fast no-op and the order stays exactly as manual fulfillment left it.
export async function dispatchOrderToProvider(orderId: string): Promise<ProviderDispatchResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { outcome: "error", message: "Pesanan tidak ditemukan." };

  const settings = await getProviderSettings();
  if (!settings.isEnabled || !settings.apiBaseUrl || !settings.apiUsername || !settings.apiKey) {
    return { outcome: "not_configured" };
  }

  // Never ship product for an order that isn't actually paid. The automatic
  // caller only ever reaches here right after confirming PAID, and the admin
  // UI only shows "Kirim ke Provider" for PAID/PROCESSING — but this function
  // is the one place that truly guarantees it, regardless of caller.
  if (order.status !== "PAID" && order.status !== "PROCESSING") {
    return {
      outcome: "not_configured",
      message: "Pesanan ini belum berstatus Sudah Dibayar / Sedang Diproses.",
    };
  }

  const denomination = await prisma.denomination.findUnique({
    where: { id: order.denominationId },
  });
  if (!denomination?.providerSku) {
    return {
      outcome: "not_configured",
      message: "Nominal ini belum dihubungkan ke kode produk provider.",
    };
  }

  const refId = order.providerRefId ?? order.orderCode;
  const customerNo = buildCustomerNo(order.playerId, order.zoneId);

  const body: UnknownRecord = {
    username: settings.apiUsername,
    buyer_sku_code: denomination.providerSku,
    customer_no: customerNo,
    ref_id: refId,
  };
  if (settings.useMd5Signature) {
    body.sign = buildSignature(settings.apiUsername, settings.apiKey, refId);
  }

  try {
    const response = await fetch(settings.apiBaseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });

    const json = await response.json().catch(() => null);
    const parsed = parseProviderResponse(json);
    // An HTTP-level failure (4xx/5xx) is always treated as failed, regardless
    // of what the (possibly error-page) body happens to contain — never let
    // a non-2xx response be read as success/pending.
    const classified = response.ok ? classifyStatus(parsed.status) : "failed";
    // Only move an order forward from PAID/PROCESSING. If an admin has since
    // manually set it to FAILED/CANCELLED/etc (e.g. a refund decision), a
    // dispatch response — automatic or a manual retry — must never overturn
    // that back to COMPLETED.
    const inFlight = order.status === "PAID" || order.status === "PROCESSING";

    await prisma.order.update({
      where: { id: order.id },
      data: {
        providerRefId: refId,
        ...(parsed.trxId ? { providerTrxId: parsed.trxId } : {}),
        providerStatus: parsed.status ?? (response.ok ? "unknown" : `http_${response.status}`),
        providerMessage: parsed.message,
        fulfillmentSentAt: new Date(),
        ...(inFlight && classified === "success"
          ? { status: "COMPLETED", fulfilledAt: new Date() }
          : {}),
        ...(inFlight && classified === "pending" && order.status === "PAID"
          ? { status: "PROCESSING" }
          : {}),
      },
    });

    if (classified === "success") {
      return { outcome: "success", message: parsed.message ?? undefined, trxId: parsed.trxId ?? undefined };
    }
    if (classified === "pending") {
      return { outcome: "pending", message: parsed.message ?? undefined };
    }
    return { outcome: "failed", message: parsed.message ?? "Provider menolak transaksi." };
  } catch (error) {
    console.error(`[provider] dispatch failed for ${order.orderCode}:`, error);
    await prisma.order.update({
      where: { id: order.id },
      data: {
        providerRefId: refId,
        providerStatus: "error",
        providerMessage: "Gagal menghubungi provider.",
        fulfillmentSentAt: new Date(),
      },
    });
    return { outcome: "error", message: "Gagal menghubungi provider." };
  }
}
