import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "ngestore_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Set a random 64-char hex string in .env (see .env.example).",
    );
  }
  return new TextEncoder().encode(secret);
}

export type AdminSessionPayload = {
  adminId: string;
  email: string;
  name: string;
};

export async function createSessionToken(payload: AdminSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.adminId === "string" &&
      typeof payload.email === "string" &&
      typeof payload.name === "string"
    ) {
      return { adminId: payload.adminId, email: payload.email, name: payload.name };
    }
    return null;
  } catch {
    return null;
  }
}

// Server Component / Route Handler helper — reads the session from cookies().
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
