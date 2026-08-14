import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderCode } from "@/lib/order-code";
import { getSnapClient } from "@/lib/midtrans";
import { checkoutSchema } from "@/lib/validation/checkout";
import {
  DEFAULT_MAINTENANCE_MESSAGE,
  getMaintenanceSettings,
  isWithinMaintenanceWindow,
} from "@/lib/maintenance";

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Data yang dikirim tidak valid." },
        { status: 400 },
      );
    }

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Data yang dikirim tidak valid.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const maintenance = await getMaintenanceSettings();
    if (isWithinMaintenanceWindow(maintenance)) {
      return NextResponse.json(
        { error: maintenance.message || DEFAULT_MAINTENANCE_MESSAGE },
        { status: 503 },
      );
    }

    const { gameId, denominationId, playerId, zoneId, contactName, contactWhatsapp, contactEmail } =
      parsed.data;

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    const denomination = await prisma.denomination.findUnique({ where: { id: denominationId } });

    if (
      !game ||
      !denomination ||
      !game.isActive ||
      !denomination.isActive ||
      denomination.gameId !== game.id
    ) {
      return NextResponse.json(
        { error: "Game atau nominal tidak tersedia." },
        { status: 400 },
      );
    }

    if (game.requiresZoneId && (!zoneId || zoneId.trim().length === 0)) {
      return NextResponse.json(
        { error: "Zone ID wajib diisi untuk game ini." },
        { status: 400 },
      );
    }

    const amount = denomination.price;
    const orderCode = generateOrderCode();

    const order = await prisma.order.create({
      data: {
        orderCode,
        gameId: game.id,
        gameName: game.name,
        denominationId: denomination.id,
        denominationName: denomination.name,
        amount,
        playerId,
        zoneId: zoneId && zoneId.trim().length > 0 ? zoneId : null,
        contactName,
        contactWhatsapp,
        contactEmail: contactEmail && contactEmail.length > 0 ? contactEmail : null,
        status: "PENDING_PAYMENT",
      },
    });

    try {
      const snap = getSnapClient();
      const itemName = `${game.name} - ${denomination.name}`.slice(0, 50);
      const response = await snap.createTransaction({
        transaction_details: {
          order_id: order.orderCode,
          gross_amount: amount,
        },
        item_details: [
          {
            id: denomination.id,
            price: amount,
            quantity: 1,
            name: itemName,
          },
        ],
        customer_details: {
          first_name: contactName,
          email: contactEmail && contactEmail.length > 0 ? contactEmail : undefined,
          phone: contactWhatsapp,
        },
        callbacks: {
          finish: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/order/${order.orderCode}`,
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          midtransToken: response.token,
          midtransRedirectUrl: response.redirect_url,
        },
      });

      return NextResponse.json({ orderCode: order.orderCode, snapToken: response.token });
    } catch (midtransError) {
      console.error("Midtrans createTransaction failed:", midtransError);
      return NextResponse.json(
        { error: "Pembayaran belum bisa diproses saat ini. Silakan coba lagi sebentar lagi." },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/checkout:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
