import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const navItems = [
    { href: "/admin", label: "Ringkasan" },
    { href: "/admin/orders", label: "Pesanan" },
    { href: "/admin/games", label: "Katalog Game" },
    { href: "/admin/settings", label: "Pengaturan Provider" },
    { href: "/admin/maintenance", label: "Jam Operasional" },
    { href: "/admin/contact", label: "Kontak & CS" },
    { href: "/admin/users", label: "Manajemen Pengguna" },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background lg:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-border bg-surface lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 px-6 py-5">
          <Image src="/logo/ngestore-logo-dark.svg" alt="NgeStore" width={130} height={32} />
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/90 transition hover:bg-white/5"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border px-4 py-4">
          <div className="mb-3 px-1">
            <p className="truncate text-sm font-semibold text-foreground">{session.name}</p>
            <p className="truncate text-xs text-muted">{session.email}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
