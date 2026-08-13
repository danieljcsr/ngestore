import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCoreApiClient, mapMidtransStatus } from "@/lib/midtrans";
import { dispatchOrderToProvider } from "@/lib/provider";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  }

  let statusResponse;
  try {
    statusResponse = await getCoreApiClient().transaction.notification(body);
  } catch (error) {
    console.error("[midtrans/notification] failed to verify notification:", error);
    return NextResponse.json({ received: true });
  }

  const orderCode = statusResponse.order_id;

  try {
    const order = await prisma.order.findUnique({ where: { orderCode } });

    if (!order) {
      console.error(`[midtrans/notification] order not found for order_id: ${orderCode}`);
      return NextResponse.json({ received: true });
    }

    const newStatus = mapMidtransStatus(
      statusResponse.transaction_status,
      statusResponse.fraud_status,
    );

    // Defense in depth: never mark an order PAID for less (or more) than it was
    // actually created for. In normal operation this can't happen — the Snap
    // transaction is always created server-side with the order's real amount —
    // but a webhook should never blindly trust an incoming amount for something
    // as consequential as "did this order get paid".
    const paidAmount = Math.round(parseFloat(statusResponse.gross_amount));
    const amountMatches = Number.isFinite(paidAmount) && paidAmount === order.amount;
    if (newStatus === "PAID" && !amountMatches) {
      console.error(
        `[midtrans/notification] amount mismatch for ${orderCode}: expected ${order.amount}, got ${statusResponse.gross_amount}`,
      );
    }

    // The webhook only owns the PENDING_PAYMENT -> {PAID|FAILED|EXPIRED|CANCELLED}
    // transition. Once an order has left PENDING_PAYMENT — either because we already
    // recorded the payment, or because an admin has moved it into PROCESSING/COMPLETED —
    // a duplicate, delayed, or manually-resent Midtrans notification must never overwrite
    // `status` again (that would let a resent "settlement" event regress a COMPLETED
    // order back to PAID, or a stray "expire" downgrade it further).
    const canUpdateStatus =
      order.status === "PENDING_PAYMENT" && (newStatus !== "PAID" || amountMatches);

    await prisma.order.update({
      where: { id: order.id },
      data: {
        ...(canUpdateStatus ? { status: newStatus } : {}),
        ...(statusResponse.transaction_id
          ? { midtransTransactionId: statusResponse.transaction_id }
          : {}),
        midtransTransactionStatus: statusResponse.transaction_status,
        ...(statusResponse.payment_type ? { paymentMethod: statusResponse.payment_type } : {}),
        ...(canUpdateStatus && newStatus === "PAID" && !order.paidAt
          ? { paidAt: new Date() }
          : {}),
      },
    });

    // Hand this off to run after the response is sent — Midtrans expects a
    // fast 200, and dispatchOrderToProvider() can take a few seconds (or be a
    // no-op if no supplier is configured yet). after() keeps the serverless
    // function alive long enough to finish it without delaying the webhook ack.
    if (canUpdateStatus && newStatus === "PAID") {
      after(() => dispatchOrderToProvider(order.id));
    }
  } catch (error) {
    console.error("[midtrans/notification] failed to update order:", error);
  }

  return NextResponse.json({ received: true });
}
