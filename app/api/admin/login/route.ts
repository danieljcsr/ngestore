import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { verifyPassword, verifyAgainstDummyHash } from "@/lib/password";
import { loginSchema } from "@/lib/validation/admin-auth";

const GENERIC_ERROR = "Email atau password salah.";
const LOCKOUT_ERROR = "Terlalu banyak percobaan gagal. Coba lagi dalam beberapa menit.";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const { email, password } = parsed.data;

  const admin = await prisma.adminUser.findUnique({ where: { email } });

  if (admin?.lockedUntil && admin.lockedUntil.getTime() > Date.now()) {
    // Still run a bcrypt compare so a locked-out account doesn't create a new,
    // faster-response timing signal of its own.
    await verifyAgainstDummyHash(password);
    return NextResponse.json({ error: LOCKOUT_ERROR }, { status: 429 });
  }

  // Always run a same-cost bcrypt compare, even for an unknown email, so response
  // latency can't be used to enumerate valid admin addresses.
  const passwordOk = admin
    ? await verifyPassword(password, admin.passwordHash)
    : await verifyAgainstDummyHash(password);

  if (!admin || !passwordOk) {
    if (admin) {
      const attempts = admin.failedLoginAttempts + 1;
      const lockingNow = attempts >= MAX_ATTEMPTS;
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          failedLoginAttempts: lockingNow ? 0 : attempts,
          lockedUntil: lockingNow ? new Date(Date.now() + LOCKOUT_MS) : null,
        },
      });
      if (lockingNow) {
        return NextResponse.json({ error: LOCKOUT_ERROR }, { status: 429 });
      }
    }
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  if (admin.failedLoginAttempts > 0 || admin.lockedUntil) {
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  const token = await createSessionToken({
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
  return response;
}
