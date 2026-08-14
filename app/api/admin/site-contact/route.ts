import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSiteContactSettings } from "@/lib/site-contact";
import { siteContactSettingSchema } from "@/lib/validation/site-contact";

// Protected by proxy.ts (matches /api/admin/:path*) — only a logged-in admin reaches here.

export async function GET() {
  try {
    const settings = await getSiteContactSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/admin/site-contact error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = siteContactSettingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const current = await getSiteContactSettings();

    const updated = await prisma.siteContactSetting.update({
      where: { id: current.id },
      data: {
        ...(data.csWhatsapp !== undefined ? { csWhatsapp: data.csWhatsapp } : {}),
        ...(data.csEmail !== undefined ? { csEmail: data.csEmail } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/admin/site-contact error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
