# NgeStore

Website top up game — top up Diamond, UC, dan voucher game populer. Dibangun dengan
Next.js 16 (App Router), TypeScript, Tailwind CSS, Prisma, dan Midtrans Snap untuk
pembayaran.

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env   # lalu isi nilai-nilainya, lihat penjelasan di dalam file
npx prisma db push     # buat/sinkronkan database SQLite lokal
npx prisma db seed     # isi katalog game contoh + akun admin
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Dashboard admin ada di `/admin/login`
(kredensial dari `ADMIN_EMAIL`/`ADMIN_PASSWORD` di `.env`).

## Struktur penting

- `app/` — halaman & API route (App Router). `app/admin/(dashboard)` dan
  `app/admin/(auth)` adalah route group untuk area admin (dilindungi oleh `proxy.ts`
  di root, penerus `middleware.ts` di Next.js 16).
- `prisma/schema.prisma` — model data (Game, Denomination, Order, AdminUser).
- `lib/` — helper bersama: koneksi Prisma, sesi admin, wrapper Midtrans, validasi zod.
- `components/ui`, `components/layout`, `components/home` — komponen UI.

## Deploy ke production

Lihat [DEPLOY.md](./DEPLOY.md) untuk panduan lengkap deploy ke Vercel dengan domain
ngestore.id, database Postgres, dan pembayaran Midtrans.
