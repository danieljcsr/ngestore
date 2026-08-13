import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderUpdateSchema } from "@/lib/validation/admin-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = orderUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  const { status, adminNote } = parsed.data;

  const data: {
    status?: string;
    adminNote?: string;
    fulfilledAt?: Date;
  } = {};

  if (status !== undefined) {
    data.status = status;
    if (status === "COMPLETED" && !existing.fulfilledAt) {
      data.fulfilledAt = new Date();
    }
  }

  if (adminNote !== undefined) {
    data.adminNote = adminNote;
  }

  const updated = await prisma.order.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}
