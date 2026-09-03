import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const order = await prisma.order.findUnique({
    where: { orderCode: code },
    include: { game: { select: { requiresPlayerId: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({
    orderCode: order.orderCode,
    gameName: order.gameName,
    denominationName: order.denominationName,
    amount: order.amount,
    requiresPlayerId: order.game.requiresPlayerId,
    playerId: order.playerId,
    zoneId: order.zoneId,
    status: order.status,
    // Only meaningful once fulfilled — the actual voucher/serial code the
    // provider returned (see lib/provider.ts: `sn` is preferred over `trxid`
    // precisely so this holds a redeemable code, not an internal reference).
    voucherCode: order.status === "COMPLETED" ? order.providerTrxId : null,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    fulfilledAt: order.fulfilledAt ? order.fulfilledAt.toISOString() : null,
  });
}
