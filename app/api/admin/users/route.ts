import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { adminUserCreateSchema } from "@/lib/validation/admin-users";

// Protected by proxy.ts (matches /api/admin/:path*) — only a logged-in admin reaches here.

export async function GET() {
  try {
    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("GET /api/admin/users error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = adminUserCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, name, password, role } = parsed.data;
    const passwordHash = await hashPassword(password);

    const user = await prisma.adminUser.create({
      data: { email, name, passwordHash, role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Email sudah digunakan." }, { status: 409 });
    }
    console.error("POST /api/admin/users error", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
