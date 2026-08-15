import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// @vercel/blob resolves credentials from either a static BLOB_READ_WRITE_TOKEN,
// or (when the store is connected via OIDC instead) a VERCEL_OIDC_TOKEN paired
// with BLOB_STORE_ID — see https://vercel.com/docs/vercel-blob/using-blob-sdk.
// Checking only one of these would report "not configured" even when the other
// path is fully working.
function hasBlobCredentials(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID),
  );
}

// Protected by proxy.ts (matches /api/admin/:path*) — only a logged-in admin reaches here.
export async function POST(request: NextRequest) {
  if (!hasBlobCredentials()) {
    return NextResponse.json(
      {
        error:
          "Upload gambar belum diaktifkan. Buat Blob Storage di dashboard Vercel dulu (lihat DEPLOY.md).",
      },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    }

    const extension = ALLOWED_TYPES[file.type];
    if (!extension) {
      return NextResponse.json(
        { error: "Format gambar harus JPG, PNG, atau WEBP." },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Ukuran gambar maksimal 2MB." }, { status: 400 });
    }

    const folderRaw = formData.get("folder");
    // Only known-safe path segments — never forward arbitrary client input into
    // a blob storage path.
    const folder = folderRaw === "banners" ? "banners" : "games";

    const blob = await put(`${folder}/${randomUUID()}.${extension}`, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("POST /api/admin/upload error:", error);
    return NextResponse.json({ error: "Gagal mengunggah gambar. Coba lagi." }, { status: 500 });
  }
}
