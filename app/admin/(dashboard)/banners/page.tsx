import { prisma } from "@/lib/prisma";
import { BannersManager } from "./BannersManager";

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Banner Slider</h1>
        <p className="mt-1 text-sm text-muted">
          Kelola banner promo yang tampil di bagian atas halaman Semua Game.
        </p>
      </div>

      <BannersManager
        initialBanners={banners.map((b) => ({
          ...b,
          createdAt: b.createdAt.toISOString(),
          updatedAt: b.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
