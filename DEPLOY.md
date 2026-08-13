# Panduan Deploy NgeStore ke Production

Target akhir: **ngestore.id** hidup di internet, menerima pembayaran sungguhan lewat
Midtrans, dengan database Postgres, di-hosting di Vercel.

Beberapa langkah di bawah **harus dilakukan sendiri oleh Anda** (bikin akun, isi data
bisnis, klik tombol di dashboard pihak ketiga) — ini bukan sesuatu yang bisa dilakukan
otomatis dari sini demi keamanan akun Anda. Ikuti urutannya karena beberapa langkah
saling bergantung.

---

## 0. Sebelum mulai: satu perubahan wajib di kode

Database lokal selama development pakai SQLite (tanpa setup). Production memakai
Postgres. Sebelum deploy pertama kali, ubah satu baris di `prisma/schema.prisma`:

```diff
 datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
 }
```

Ini perubahan permanen (bukan sesuatu yang di-toggle bolak-balik) — begitu production
jalan di Postgres, baris ini seharusnya tetap `"postgresql"` seterusnya. Commit
perubahan ini setelah Anda mengubahnya.

---

## 1. Siapkan database Postgres

Rekomendasi: pakai fitur **Storage** bawaan Vercel (didukung oleh Neon), supaya tidak
perlu daftar akun terpisah dan environment variable-nya otomatis tersambung ke project.
Langkah ini dilakukan setelah project Vercel dibuat di bagian 3 — jadi lewati dulu ke
bagian 3, lalu kembali ke sini.

Kalau lebih suka akun Neon terpisah (neon.tech, ada tier gratis): buat akun, buat
project baru, salin **connection string**-nya (formatnya
`postgresql://user:password@host/dbname?sslmode=require`) untuk dipakai sebagai
`DATABASE_URL` di bagian 4.

**Catatan penting nama variabel:** Prisma di project ini membaca env var bernama
persis `DATABASE_URL`. Kalau integrasi Vercel Storage memberi nama lain (mis.
`POSTGRES_URL` atau `POSTGRES_PRISMA_URL`), tambahkan satu env var lagi bernama
`DATABASE_URL` dengan nilai yang sama.

---

## 2. Siapkan akun Midtrans

1. Daftar di [dashboard.midtrans.com](https://dashboard.midtrans.com/register).
2. Setelah masuk, mode **Sandbox** sudah aktif otomatis — ambil **Sandbox Server Key**
   dan **Sandbox Client Key** di menu *Settings > Access Keys*. Pakai ini dulu supaya
   situs bisa langsung live dan diuji coba (pembayaran belum sungguhan, cuma simulasi).
3. Untuk menerima pembayaran **sungguhan**, ajukan aktivasi akun bisnis (butuh
   dokumen seperti KTP/NPWP/rekening bank) di menu yang sama. Proses verifikasi ini
   di luar kendali kami dan bisa makan waktu beberapa hari — situs tetap bisa live
   dengan Sandbox sambil menunggu.
4. **Wajib**, supaya status pembayaran otomatis ter-update di situs: buka
   *Settings > Configuration*, isi **Payment Notification URL** dengan:
   ```
   https://ngestore.id/api/midtrans/notification
   ```
   Isi ini di **kedua** mode (Sandbox dan Production) — masing-masing mode punya
   pengaturan notification URL sendiri. Tanpa langkah ini, pesanan akan macet selamanya
   di status "Menunggu Pembayaran" walau pelanggan sudah bayar.

---

## 3. Push kode ke GitHub

Vercel deploy paling praktis lewat GitHub (deploy otomatis tiap ada perubahan kode).

1. Buat repository baru (kosong, jangan centang "Add README") di
   [github.com/new](https://github.com/new), misalnya `ngestore`.
2. Di folder project (`D:\NGESTORE`), jalankan:
   ```bash
   git remote add origin https://github.com/<username-anda>/ngestore.git
   git branch -M main
   git push -u origin main
   ```

---

## 4. Deploy ke Vercel

1. Buat akun di [vercel.com](https://vercel.com/signup) (bisa langsung pakai akun
   GitHub Anda).
2. Klik **Add New > Project**, pilih repo `ngestore` yang barusan di-push.
3. Vercel otomatis mendeteksi ini project Next.js — biarkan pengaturan build default.
4. **Jangan klik Deploy dulu.** Buka tab **Environment Variables**, isi semua ini:

   | Nama | Nilai |
   |---|---|
   | `DATABASE_URL` | connection string Postgres dari bagian 1 |
   | `MIDTRANS_SERVER_KEY` | Sandbox Server Key dari bagian 2 |
   | `MIDTRANS_CLIENT_KEY` | Sandbox Client Key dari bagian 2 |
   | `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | sama dengan `MIDTRANS_CLIENT_KEY` |
   | `MIDTRANS_IS_PRODUCTION` | `false` (ganti ke `true` nanti setelah pakai key production) |
   | `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | `false` |
   | `SESSION_SECRET` | string acak baru — **jangan pakai nilai yang sama dengan di laptop Anda**. Generate dengan `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `ADMIN_EMAIL` | email login admin Anda |
   | `ADMIN_PASSWORD` | password kuat, minimal 10 karakter, jangan nilai contoh di `.env.example` |
   | `NEXT_PUBLIC_SITE_URL` | `https://ngestore.id` (boleh isi URL sementara `https://<nama-project>.vercel.app` dulu kalau domain belum tersambung, lalu update setelah bagian 6) |

5. Kalau belum bikin database Postgres di bagian 1: sekarang buka tab **Storage** di
   project Vercel ini, buat database Postgres baru, ikuti langkah otomatisnya (ini
   akan mengisi `DATABASE_URL` untuk Anda — cek namanya sesuai catatan di bagian 1).
6. Klik **Deploy**. Build pertama akan otomatis menjalankan `prisma generate` (lewat
   `postinstall` di `package.json`), tapi **belum** membuat tabel di database —
   lanjut ke bagian 5.

---

## 5. Siapkan skema & isi data awal di database production

Dari komputer Anda (folder project):

```bash
npx vercel login          # login ke akun Vercel Anda lewat browser
npx vercel link           # sambungkan folder ini ke project Vercel yang baru dibuat
npx vercel env pull .env.production.local   # tarik semua env var production ke file lokal
```

Lalu jalankan (memakai env var production yang barusan ditarik):

```bash
npx dotenv -e .env.production.local -- npx prisma db push
npx dotenv -e .env.production.local -- npx prisma db seed
```

Kalau `dotenv` CLI belum terpasang, jalankan dulu `npm install -D dotenv-cli`, atau
cukup salin isi `.env.production.local` ke `.env` sementara, jalankan
`npx prisma db push` lalu `npx prisma db seed`, dan kembalikan `.env` seperti semula
setelah selesai (jangan sampai `.env` lokal Anda memakai `DATABASE_URL` production
dalam jangka panjang, supaya perubahan saat development tidak menyentuh data live).

Ini akan membuat seluruh tabel dan mengisi katalog 11 game contoh + satu akun admin
sesuai `ADMIN_EMAIL`/`ADMIN_PASSWORD` yang Anda isi di bagian 4.

---

## 6. Sambungkan domain ngestore.id (DewaBiz)

1. Di project Vercel, buka **Settings > Domains**, ketik `ngestore.id`, klik **Add**.
2. Vercel akan menampilkan DNS record yang perlu ditambahkan (biasanya A record ke
   `76.76.21.21` untuk `ngestore.id`, dan CNAME `www` ke `cname.vercel-dns.com` —
   **pakai persis nilai yang ditampilkan Vercel saat itu**, karena bisa berbeda).
3. Login ke panel DewaBiz Anda, buka pengaturan DNS/Zone Editor untuk domain
   `ngestore.id`, tambahkan record persis seperti yang diminta Vercel.
4. Tunggu propagasi DNS (biasanya menit-jam, maksimal ~48 jam). Vercel otomatis
   menerbitkan SSL (https) begitu DNS terdeteksi benar — status di halaman Domains
   akan berubah jadi centang hijau.
5. Update env var `NEXT_PUBLIC_SITE_URL` di Vercel jadi `https://ngestore.id` (kalau
   sebelumnya masih pakai URL `.vercel.app`), lalu buka tab **Deployments**, klik
   deployment terakhir, **Redeploy** — env var baru baru berlaku setelah redeploy.

---

## 7. Uji coba end-to-end

1. Buka `https://ngestore.id`, pastikan halaman muncul normal.
2. Coba alur top up sampai klik "Bayar Sekarang" — karena masih pakai Sandbox key,
   popup Midtrans akan muncul dengan metode pembayaran simulasi (kartu test, QRIS
   sandbox, dsb — detail metode test ada di dokumentasi Midtrans Sandbox).
3. Setelah "bayar" di popup sandbox, cek halaman `/order/<kode-pesanan>` — status
   harus berubah otomatis jadi "Sudah Dibayar" dalam beberapa detik (ini membuktikan
   Payment Notification URL di bagian 2 sudah benar).
4. Login ke `/admin/login`, cek pesanan tadi muncul di **Pesanan**, coba ubah
   statusnya ke "Selesai".

## 8. Pindah ke pembayaran sungguhan (setelah Midtrans approve akun bisnis)

Setelah Midtrans mengaktifkan akun production Anda:

1. Ambil **Production Server Key** dan **Production Client Key** (bukan yang diawali
   `SB-Mid-`) di dashboard Midtrans.
2. Update di Vercel: `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`,
   `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` dengan key production, lalu
   `MIDTRANS_IS_PRODUCTION=true` dan `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=true`.
3. Pastikan Payment Notification URL di bagian 2 juga sudah diisi di sisi
   **Production** dashboard Midtrans (terpisah dari sisi Sandbox).
4. Redeploy dari tab Deployments.
5. Lakukan satu transaksi nominal kecil sungguhan untuk memastikan semuanya benar
   sebelum mengumumkan situs secara luas.

---

## Checklist keamanan sebelum go-live

- [ ] `ADMIN_PASSWORD` bukan nilai contoh, minimal 10 karakter, unik.
- [ ] `SESSION_SECRET` di production berbeda dari yang di laptop lokal.
- [ ] Aktifkan verifikasi 2 langkah di akun Vercel, GitHub, dan Midtrans Anda.
- [ ] `.env` / `.env.production.local` tidak pernah ter-commit ke git (sudah
      dicegah lewat `.gitignore`, tapi selalu cek ulang sebelum `git add`).
- [ ] Sudah coba login admin dengan password salah 5x untuk memastikan akun
      terkunci sementara (fitur anti brute-force bawaan).
