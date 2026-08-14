import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMaintenanceSettings } from "@/lib/maintenance";
import { maintenanceSettingSchema } from "@/lib/validation/maintenance";

// Protected by proxy.ts (matches /api/admin/:path*) — only a logged-in admin reaches here.

export async function GET() {
  try {
    const settings = await getMaintenanceSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/admin/maintenance-settings error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = maintenanceSettingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const current = await getMaintenanceSettings();

    const updated = await prisma.maintenanceSetting.update({
      where: { id: current.id },
      data: {
        ...(data.isEnabled !== undefined ? { isEnabled: data.isEnabled } : {}),
        ...(data.startTime !== undefined ? { startTime: data.startTime } : {}),
        ...(data.endTime !== undefined ? { endTime: data.endTime } : {}),
        ...(data.message !== undefined ? { message: data.message } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/admin/maintenance-settings error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
