import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProviderSettings } from "@/lib/provider";

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

// Public endpoint — give this URL (with the token) to your supplier as their
// callback/webhook URL, e.g.:
//   https://ngestore.id/api/provider/callback?token=<callbackToken>
// Not under /api/admin, so it's not covered by the admin-session check in
// proxy.ts; authenticity instead comes from the shared `callbackToken`
// (as ?token=... or an X-Callback-Token header) configured in /admin/settings.
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  }

  const settings = await getProviderSettings();
  const providedToken =
    request.nextUrl.searchParams.get("token") ?? request.headers.get("x-callback-token");

  if (!settings.callbackToken || providedToken !== settings.callbackToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const root = asRecord(body);
  const data = asRecord(root.data ?? root);

  const refId = firstString(data, ["ref_id", "reference_id", "trx_id"]);
  const status = firstString(data, ["status", "transaction_status", "result"]);
  const message = firstString(data, ["message", "msg", "description"]);
  const trxId = firstString(data, ["trx_id", "sn", "transaction_id"]);

  if (!refId) {
    return NextResponse.json({ error: "ref_id tidak ditemukan di payload." }, { status: 400 });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { OR: [{ providerRefId: refId }, { orderCode: refId }] },
    });

    if (!order) {
      console.error(`[provider/callback] no order found for ref_id: ${refId}`);
      return NextResponse.json({ received: true });
    }

    const classified = classifyStatus(status);
    // Only PAID/PROCESSING are "in-flight fulfillment" states a callback is
    // allowed to move. This blocks more than the obvious COMPLETED-regression
    // case: if an admin has since manually set the order to FAILED/CANCELLED
    // (e.g. after deciding to refund), a late/delayed/duplicate callback must
    // not silently overturn that human decision back to COMPLETED.
    const inFlight = order.status === "PAID" || order.status === "PROCESSING";

    await prisma.order.update({
      where: { id: order.id },
      data: {
        providerStatus: status ?? order.providerStatus,
        providerMessage: message ?? order.providerMessage,
        ...(trxId ? { providerTrxId: trxId } : {}),
        ...(inFlight && classified === "success"
          ? { status: "COMPLETED", fulfilledAt: new Date() }
          : {}),
        // A failure after we'd optimistically moved to PROCESSING falls
        // back to PAID — same "paid but needs a human" state as any other
        // fulfillment failure, not a payment failure.
        ...(classified === "failed" && order.status === "PROCESSING"
          ? { status: "PAID" }
          : {}),
      },
    });
  } catch (error) {
    console.error("[provider/callback] failed to update order:", error);
  }

  return NextResponse.json({ received: true });
}
