import { createHash } from "crypto";
import { ProxyAgent, fetch as undiciFetch } from "undici";
import { prisma } from "@/lib/prisma";

// Talks to whatever automatic top-up supplier (H2H provider) the store owner
// configures from /admin/settings. Two request/response shapes are supported
// out of the box, selected via ProviderSetting.requestFormat:
//
//   "digiflazz"   — username + buyer_sku_code + customer_no + ref_id[+ md5
//                   sign], response has a text `status` field
//                   ("Sukses"/"Pending"/"Gagal"). Matches Digiflazz and the
//                   many reseller panels that clone its API outright.
//
//   "bearer_json" — Authorization: Bearer {apiKey}, JSON body
//                   {code, msisdn, request_id}, response has a numeric `rc`
//                   response code ("00" = sukses, "68" = pending, anything
//                   else = a specific failure reason). Matches the H2H API
//                   documented by Media Cakrawangsa and similar panels.
//
// If a future provider needs a third shape, add a case to buildRequest() and
// parseProviderResponse()/classify() below — nothing outside this file needs
// to change.

export type RequestFormat = "digiflazz" | "bearer_json";

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
  // orderBy makes this deterministic (always the earliest row) if a
  // check-then-create race ever produces more than one — see the
  // lib/site-contact.ts comment for how this actually happened in practice
  // for a sibling singleton settings table.
  const existing = await prisma.providerSetting.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  return prisma.providerSetting.create({ data: {} });
}

function buildSignature(username: string, apiKey: string, refId: string): string {
  return createHash("md5").update(`${username}${apiKey}${refId}`).digest("hex");
}

// Digiflazz's own convention for games that need a server/zone id (e.g.
// Mobile Legends) is "<user_id> <zone_id>" — space separated. Other
// providers document this destination field as numbers-only and misparse a
// space, so the join character is admin-configurable (ProviderSetting.zoneSeparator)
// rather than hardcoded.
function buildCustomerNo(playerId: string, zoneId: string | null, separator: string): string {
  return zoneId ? `${playerId}${separator}${zoneId}` : playerId;
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

type ParsedResponse = {
  status: string | null;
  message: string | null;
  trxId: string | null;
};

type ClassifiedStatus = "success" | "pending" | "failed" | "unknown";

// --- digiflazz-style parsing (text status field) ---

function parseDigiflazzResponse(body: unknown): ParsedResponse {
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

function classifyDigiflazzStatus(status: string | null): ClassifiedStatus {
  if (!status) return "unknown";
  const normalized = status.toLowerCase();
  if (["sukses", "success", "completed", "sccs"].includes(normalized)) return "success";
  if (["gagal", "failed", "error", "cancel", "canceled", "cancelled"].includes(normalized)) {
    return "failed";
  }
  if (["pending", "processing", "diproses", "process"].includes(normalized)) return "pending";
  return "unknown";
}

// --- bearer_json-style parsing (numeric "rc" response code) ---
// rc "00" = sukses, "68" = pending menunggu callback, anything else present
// is one of their documented failure/error codes (invalid payload, saldo
// tidak cukup, produk ditutup, dll) — treated as failed either way, with the
// exact reason preserved in `message`/providerStatus for the admin to see.

function parseBearerJsonResponse(body: unknown): ParsedResponse {
  const data = asRecord(body);
  return {
    status: firstString(data, ["rc"]),
    message: firstString(data, ["message"]),
    // `sn` is the actual serial number/voucher redemption code — the thing an
    // admin or customer would need as proof of delivery. `trxid` is just
    // MCW's internal numeric reference and is present even while pending (sn
    // is empty then), so it's only used as a fallback when sn isn't set yet.
    trxId: firstString(data, ["sn", "trxid"]),
  };
}

function classifyBearerJsonStatus(rc: string | null): ClassifiedStatus {
  if (!rc) return "unknown";
  if (rc === "00") return "success";
  if (rc === "68") return "pending";
  return "failed";
}

function parseProviderResponse(format: RequestFormat, body: unknown): ParsedResponse {
  return format === "bearer_json" ? parseBearerJsonResponse(body) : parseDigiflazzResponse(body);
}

function classifyStatus(format: RequestFormat, status: string | null): ClassifiedStatus {
  return format === "bearer_json"
    ? classifyBearerJsonStatus(status)
    : classifyDigiflazzStatus(status);
}

// Sends a PAID order to the configured supplier. Always resolves (never
// throws) — a misconfigured or unreachable provider must never break the
// order/payment flow around it. When no provider is configured yet, this is
// a fast no-op and the order stays exactly as manual fulfillment left it.
export async function dispatchOrderToProvider(orderId: string): Promise<ProviderDispatchResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { outcome: "error", message: "Pesanan tidak ditemukan." };

  const settings = await getProviderSettings();
  const format = (settings.requestFormat as RequestFormat) ?? "digiflazz";
  if (!settings.isEnabled || !settings.apiBaseUrl || !settings.apiKey) {
    return { outcome: "not_configured" };
  }
  if (format === "digiflazz" && !settings.apiUsername) {
    return { outcome: "not_configured" };
  }
  const apiBaseUrl = settings.apiBaseUrl;
  const apiKey = settings.apiKey;

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
  const customerNo = buildCustomerNo(order.playerId, order.zoneId, settings.zoneSeparator);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  let body: UnknownRecord;

  if (format === "bearer_json") {
    headers.Authorization = `Bearer ${apiKey}`;
    body = { code: denomination.providerSku, msisdn: customerNo, request_id: refId };
  } else {
    body = {
      username: settings.apiUsername,
      buyer_sku_code: denomination.providerSku,
      customer_no: customerNo,
      ref_id: refId,
    };
    if (settings.useMd5Signature && settings.apiUsername) {
      body.sign = buildSignature(settings.apiUsername, apiKey, refId);
    }
    headers.Authorization = `Bearer ${apiKey}`;
  }
  if (settings.transactionPin) {
    body.pin = settings.transactionPin;
  }

  try {
    // Vercel serverless functions have no fixed outbound IP by default. If
    // the provider requires IP whitelisting, route through a static-IP proxy
    // (e.g. Fixie's FIXIE_URL) configured as outboundProxyUrl — otherwise
    // connect directly, unchanged from before.
    const dispatcher = settings.outboundProxyUrl
      ? new ProxyAgent(settings.outboundProxyUrl)
      : undefined;

    const response = await undiciFetch(apiBaseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
      ...(dispatcher ? { dispatcher } : {}),
    });

    const json = await response.json().catch(() => null);
    const parsed = parseProviderResponse(format, json);
    // Trust a successfully-parsed status code from the body over the raw
    // HTTP status: confirmed live against Media Cakrawangsa that they return
    // structured rc-coded JSON (e.g. rc "05" produk tidak dikenali) on 4xx
    // responses, not just on 2xx. Only force "failed" when the body couldn't
    // be parsed into a status at all (e.g. a gateway/error HTML page) and the
    // HTTP call itself also failed — never let that unparseable case be read
    // as success/pending.
    const classified =
      parsed.status !== null ? classifyStatus(format, parsed.status) : response.ok ? "unknown" : "failed";
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
