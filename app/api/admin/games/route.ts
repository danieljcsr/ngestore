import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { gameCreateSchema } from "@/lib/validation/admin-catalog";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = gameCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data game tidak valid.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const game = await prisma.game.create({
      data: {
        name: data.name,
        slug: data.slug,
        category: data.category,
        badgeLabel: data.badgeLabel,
        badgeFrom: data.badgeFrom,
        badgeTo: data.badgeTo,
        imageUrl: data.imageUrl ?? null,
        requiresZoneId: data.requiresZoneId,
        playerIdLabel: data.playerIdLabel ?? undefined,
        zoneIdLabel: data.zoneIdLabel ?? undefined,
        instructions: data.instructions ?? null,
        isFeatured: data.isFeatured,
        isActive: data.isActive,
      },
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Slug sudah digunakan, pilih slug lain." },
        { status: 409 },
      );
    }

    console.error("POST /api/admin/games error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
