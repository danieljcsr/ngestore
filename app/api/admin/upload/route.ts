import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Protected by proxy.ts (matches /api/admin/:path*) — only a logged-in admin reaches here.
export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
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

    const blob = await put(`games/${randomUUID()}.${extension}`, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("POST /api/admin/upload error:", error);
    return NextResponse.json({ error: "Gagal mengunggah gambar. Coba lagi." }, { status: 500 });
  }
}
