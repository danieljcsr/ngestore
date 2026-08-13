import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProviderSettings } from "@/lib/provider";
import { providerSettingSchema } from "@/lib/validation/provider";

// Protected by proxy.ts (matches /api/admin/:path*) — only a logged-in admin reaches here.

export async function GET() {
  try {
    const settings = await getProviderSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/admin/provider-settings error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = providerSettingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const current = await getProviderSettings();

    const updated = await prisma.providerSetting.update({
      where: { id: current.id },
      data: {
        ...(data.isEnabled !== undefined ? { isEnabled: data.isEnabled } : {}),
        ...(data.providerName !== undefined ? { providerName: data.providerName } : {}),
        ...(data.apiBaseUrl !== undefined ? { apiBaseUrl: data.apiBaseUrl } : {}),
        ...(data.apiUsername !== undefined ? { apiUsername: data.apiUsername } : {}),
        ...(data.apiKey !== undefined ? { apiKey: data.apiKey } : {}),
        ...(data.useMd5Signature !== undefined ? { useMd5Signature: data.useMd5Signature } : {}),
        ...(data.callbackToken !== undefined ? { callbackToken: data.callbackToken } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/admin/provider-settings error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
