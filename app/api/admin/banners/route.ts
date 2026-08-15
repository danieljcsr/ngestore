import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bannerCreateSchema } from "@/lib/validation/admin-banners";

// Protected by proxy.ts (matches /api/admin/:path*) — only a logged-in admin reaches here.

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(banners);
  } catch (error) {
    console.error("GET /api/admin/banners error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bannerCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const currentCount = await prisma.banner.count();

    const banner = await prisma.banner.create({
      data: {
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl ?? null,
        altText: data.altText ?? "Promo",
        isActive: data.isActive,
        sortOrder: currentCount,
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/banners error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
