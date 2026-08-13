import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { gameUpdateSchema } from "@/lib/validation/admin-catalog";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = gameUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data game tidak valid.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const game = await prisma.game.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.badgeLabel !== undefined ? { badgeLabel: data.badgeLabel } : {}),
        ...(data.badgeFrom !== undefined ? { badgeFrom: data.badgeFrom } : {}),
        ...(data.badgeTo !== undefined ? { badgeTo: data.badgeTo } : {}),
        ...(data.requiresZoneId !== undefined ? { requiresZoneId: data.requiresZoneId } : {}),
        ...(data.playerIdLabel !== undefined ? { playerIdLabel: data.playerIdLabel } : {}),
        ...(data.zoneIdLabel !== undefined ? { zoneIdLabel: data.zoneIdLabel } : {}),
        ...(data.instructions !== undefined ? { instructions: data.instructions || null } : {}),
        ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });

    return NextResponse.json(game, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Slug sudah digunakan, pilih slug lain." },
          { status: 409 },
        );
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Game tidak ditemukan." }, { status: 404 });
      }
    }

    console.error("PATCH /api/admin/games/[id] error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
