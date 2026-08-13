import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchOrderToProvider } from "@/lib/provider";

const OUTCOME_MESSAGE: Record<string, string> = {
  success: "Berhasil dikirim dan langsung sukses di provider.",
  pending: "Berhasil dikirim, provider sedang memproses.",
  failed: "Terkirim tapi provider menolak transaksi ini.",
  not_configured: "Provider belum diaktifkan atau nominal ini belum punya kode produk.",
  error: "Gagal menghubungi provider. Coba lagi sebentar.",
};

// Protected by proxy.ts (matches /api/admin/:path*) — only a logged-in admin reaches here.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    const result = await dispatchOrderToProvider(id);

    return NextResponse.json({
      ...result,
      summary: result.message || OUTCOME_MESSAGE[result.outcome],
    });
  } catch (error) {
    console.error("POST /api/admin/orders/[id]/dispatch error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
