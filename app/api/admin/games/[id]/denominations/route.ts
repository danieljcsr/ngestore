import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { denominationCreateSchema } from "@/lib/validation/admin-catalog";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = denominationCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data nominal tidak valid.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const game = await prisma.game.findUnique({ where: { id }, select: { id: true } });
    if (!game) {
      return NextResponse.json({ error: "Game tidak ditemukan." }, { status: 404 });
    }

    const data = parsed.data;

    const currentCount = await prisma.denomination.count({ where: { gameId: id } });

    const denomination = await prisma.denomination.create({
      data: {
        gameId: id,
        name: data.name,
        price: data.price,
        note: data.note ?? null,
        isPopular: data.isPopular,
        isActive: true,
        sortOrder: currentCount,
      },
    });

    return NextResponse.json(denomination, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/games/[id]/denominations error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
