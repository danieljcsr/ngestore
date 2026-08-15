import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { getCurrentAdminIsOwner } from "@/lib/admin-users";
import { UsersManager } from "./UsersManager";

export default async function AdminUsersPage() {
  const isOwner = await getCurrentAdminIsOwner();
  if (!isOwner) {
    redirect("/admin");
  }

  const [users, session] = await Promise.all([
    prisma.adminUser.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    }),
    getAdminSession(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Pengguna</h1>
          <p className="mt-1 text-sm text-muted">
            Kelola akun yang bisa masuk ke dashboard admin ini.
          </p>
        </div>
      </div>

      <UsersManager
        initialUsers={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        currentUserId={session?.adminId ?? null}
      />
    </div>
  );
}
