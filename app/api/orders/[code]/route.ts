import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const order = await prisma.order.findUnique({
    where: { orderCode: code },
  });

  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({
    orderCode: order.orderCode,
    gameName: order.gameName,
    denominationName: order.denominationName,
    amount: order.amount,
    playerId: order.playerId,
    zoneId: order.zoneId,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    fulfilledAt: order.fulfilledAt ? order.fulfilledAt.toISOString() : null,
  });
}
