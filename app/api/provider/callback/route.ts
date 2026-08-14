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

// Some H2H providers (see docs for the "bearer_json" format, e.g. Media
// Cakrawangsa) send their async transaction report as XML-RPC rather than
// JSON — a <methodCall>/<methodResponse> with a flat <member><name>X</name>
// <value><string>Y</string></value></member> struct. This is a minimal,
// purpose-built extractor for exactly that shape (not a general XML parser).
function extractXmlMember(xml: string, name: string): string | null {
  const match = xml.match(
    new RegExp(`<name>\\s*${name}\\s*</name>\\s*<value>\\s*<string>([^<]*)</string>`, "i"),
  );
  return match ? match[1] : null;
}

function parseXmlReport(xml: string): UnknownRecord {
  return {
    request_id: extractXmlMember(xml, "REQUESTID"),
    rc: extractXmlMember(xml, "RESPONSECODE"),
    message: extractXmlMember(xml, "MESSAGE"),
    trxid: extractXmlMember(xml, "TRANSACTIONID"),
    sn: extractXmlMember(xml, "SN"),
  };
}

function classifyStatus(
  format: string,
  data: UnknownRecord,
): "success" | "pending" | "failed" | "unknown" {
  if (format === "bearer_json") {
    const rc = firstString(data, ["rc", "RESPONSECODE"]);
    if (!rc) return "unknown";
    if (rc === "00") return "success";
    if (rc === "68") return "pending";
    return "failed";
  }

  const status = firstString(data, ["status", "transaction_status", "result"]);
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
  const rawBody = await request.text();
  let data: UnknownRecord;

  const trimmed = rawBody.trim();
  if (trimmed.startsWith("<")) {
    data = parseXmlReport(trimmed);
  } else {
    try {
      const parsed = JSON.parse(rawBody) as unknown;
      const root = asRecord(parsed);
      data = asRecord(root.data ?? root);
    } catch {
      return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
    }
  }

  const settings = await getProviderSettings();
  const providedToken =
    request.nextUrl.searchParams.get("token") ?? request.headers.get("x-callback-token");

  if (!settings.callbackToken || providedToken !== settings.callbackToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const refId = firstString(data, ["ref_id", "reference_id", "request_id", "REQUESTID", "trx_id"]);
  const message = firstString(data, ["message", "msg", "description", "MESSAGE"]);
  const trxId = firstString(data, ["trxid", "trx_id", "sn", "transaction_id", "TRANSACTIONID", "SN"]);
  const statusRaw = firstString(data, [
    "rc",
    "RESPONSECODE",
    "status",
    "transaction_status",
    "result",
  ]);

  if (!refId) {
    return NextResponse.json({ error: "ref_id/request_id tidak ditemukan di payload." }, {
      status: 400,
    });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { OR: [{ providerRefId: refId }, { orderCode: refId }] },
    });

    if (!order) {
      console.error(`[provider/callback] no order found for ref_id: ${refId}`);
      return NextResponse.json({ received: true });
    }

    const classified = classifyStatus(settings.requestFormat, data);
    // Only PAID/PROCESSING are "in-flight fulfillment" states a callback is
    // allowed to move. This blocks more than the obvious COMPLETED-regression
    // case: if an admin has since manually set the order to FAILED/CANCELLED
    // (e.g. after deciding to refund), a late/delayed/duplicate callback must
    // not silently overturn that human decision back to COMPLETED.
    const inFlight = order.status === "PAID" || order.status === "PROCESSING";

    await prisma.order.update({
      where: { id: order.id },
      data: {
        providerStatus: statusRaw ?? order.providerStatus,
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
