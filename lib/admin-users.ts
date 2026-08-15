import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// Checked fresh against the DB rather than trusting a flag baked into the
// session JWT — so revoking owner access takes effect on the very next
// request instead of waiting for the token to expire.
export async function getCurrentAdminIsOwner(): Promise<boolean> {
  const session = await getAdminSession();
  if (!session) return false;

  const user = await prisma.adminUser.findUnique({
    where: { id: session.adminId },
    select: { isOwner: true },
  });

  return user?.isOwner ?? false;
}
