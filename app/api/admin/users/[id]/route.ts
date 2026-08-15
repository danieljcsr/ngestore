import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { getCurrentAdminIsOwner } from "@/lib/admin-users";
import { adminUserUpdateSchema } from "@/lib/validation/admin-users";

const FORBIDDEN_ERROR = "Hanya pemilik akun yang bisa mengelola pengguna.";

// Protected by proxy.ts (matches /api/admin/:path*) — only a logged-in admin
// reaches here at all; the isOwner check below further restricts this route
// to the owner account specifically (Manajemen Pengguna is owner-only).

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getCurrentAdminIsOwner())) {
      return NextResponse.json({ error: FORBIDDEN_ERROR }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = adminUserUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const passwordHash = data.password ? await hashPassword(data.password) : undefined;

    const user = await prisma.adminUser.update({
      where: { id },
      data: {
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(passwordHash !== undefined ? { passwordHash } : {}),
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "Email sudah digunakan." }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
      }
    }
    console.error("PATCH /api/admin/users/[id] error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getCurrentAdminIsOwner())) {
      return NextResponse.json({ error: FORBIDDEN_ERROR }, { status: 403 });
    }

    const { id } = await params;
    const session = await getAdminSession();

    if (session?.adminId === id) {
      return NextResponse.json(
        { error: "Tidak bisa menghapus akun yang sedang Anda gunakan." },
        { status: 400 },
      );
    }

    const totalAdmins = await prisma.adminUser.count();
    if (totalAdmins <= 1) {
      return NextResponse.json(
        { error: "Tidak bisa menghapus satu-satunya akun admin yang tersisa." },
        { status: 400 },
      );
    }

    await prisma.adminUser.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }
    console.error("DELETE /api/admin/users/[id] error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
