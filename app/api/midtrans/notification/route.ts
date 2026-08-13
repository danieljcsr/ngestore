import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCoreApiClient, mapMidtransStatus } from "@/lib/midtrans";

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

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        ...(statusResponse.transaction_id
          ? { midtransTransactionId: statusResponse.transaction_id }
          : {}),
        midtransTransactionStatus: statusResponse.transaction_status,
        ...(statusResponse.payment_type ? { paymentMethod: statusResponse.payment_type } : {}),
        ...(newStatus === "PAID" && !order.paidAt ? { paidAt: new Date() } : {}),
      },
    });
  } catch (error) {
    console.error("[midtrans/notification] failed to update order:", error);
  }

  return NextResponse.json({ received: true });
}
