# Antigravity & Agent Guidelines: Couple Ledger (Catatan Harian Berdua)

> **STATUS: WAJIB DITERAPKAN (STRICT ENFORCEMENT)**  
> Seluruh pengembangan, penulisan kode, arsitektur, dan interaksi pada repositori ini **WAJIB** mematuhi aturan di dokumen ini, serta dua dokumen sumber kebenaran utama:
> 1. [`project.md`](file:///c:/Users/USER/Documents/Project/CATAT_KEUANGAN/project.md) (Spesifikasi Teknis, Arsitektur, Keamanan Data, & Anti-Halusinasi)
> 2. [`design.md`](file:///c:/Users/USER/Documents/Project/CATAT_KEUANGAN/design.md) (Design System, Token Warna, Tipografi, Komponen, & Responsivitas)

---

## 1. Aturan Konfirmasi & Komunikasi (Prioritas Utama)

- **Wajib Konfirmasi Jika Ada Keraguan / Ambiguitas:**
  - Jika ada kebutuhan yang ambigu, multitafsir, bertentangan, atau belum dijelaskan secara spesifik: **JANGAN MENEBAK atau membuat asumsi sendiri**.
  - **Tanyakan dan konfirmasikan langsung kepada pengguna** sebelum menulis kode atau mengambil keputusan implementasi.
- **Transparansi Asumsi:**
  - Jika terpaksa membuat asumsi teknis sementara, tandai secara eksplisit dengan format `ASUMSI: <penjelasan>` dan minta verifikasi dari pengguna.
- **Konfirmasi Perubahan Dependency / Arsitektur:**
  - Dilarang menambahkan library baru, dependency, script pihak ketiga, atau merombak struktur folder di luar yang telah disepakati di [`project.md`](file:///c:/Users/USER/Documents/Project/CATAT_KEUANGAN/project.md) tanpa izin eksplisit dari pengguna.
- **Diskusikan Keputusan Terbuka:**
  - Pada [`project.md`](file:///c:/Users/USER/Documents/Project/CATAT_KEUANGAN/project.md), terdapat poin-poin keputusan terbuka (misalnya target offsite backup, konfigurasi domain, dll.). Diskusikan dan tanyakan saat fase terkait akan dimulai.

---

## 2. Sumber Kebenaran (Single Source of Truth)

1. **Spesifikasi Proyek:** [`project.md`](file:///c:/Users/USER/Documents/Project/CATAT_KEUANGAN/project.md)
   - Analisa kebutuhan, tech stack, arsitektur backend/frontend, skema database, workflow autentikasi, backup & deploy, aturan keamanan data, dan roadmap fase pengerjaan.
2. **Design System:** [`design.md`](file:///c:/Users/USER/Documents/Project/CATAT_KEUANGAN/design.md)
   - Pedoman visual (Airbnb-inspired), palette warna token, tipografi, radius sudut, elevation/shadow, komponen standar, dan breakpoint responsive.

*Agent dilarang membaca atau mengasumsikan file spesifikasi secara sepintas. Buka dan baca file secara mendalam sebelum mengeksekusi tugas.*

---

## 3. Tech Stack & Arsitektur Wajib (`project.md`)

- **Runtime & Package Manager:** `Bun`
- **Bahasa:** `TypeScript` (`strict: true`)
- **Backend Framework:** `Hono` (ringan, native di Bun)
- **Validasi Data:** `Zod`
- **ORM:** `Drizzle ORM`
- **Database:** `PostgreSQL 16` (di Docker, parity 100% antara local dan prod)
- **Autentikasi & Keamanan:**
  - Password hashing: `Argon2id` via `Bun.password`
  - Token: JWT access token (15 menit) + Refresh token di `httpOnly` cookie (rotasi otomatis)
- **Logging:** `pino` (JSON terstruktur dengan Request ID)
- **Testing:** `bun test`
- **Lint & Format:** ESLint + Prettier
- **Frontend:**
  - `React` + `Vite` + `TypeScript`
  - `TanStack Query` (data fetching & server state)
  - `Tailwind CSS` (styling dengan token sesuai `design.md`)
  - `Recharts` (grafik stacked bar 12 bulan & donut per bulan)
- **Gaya Arsitektur:**
  - **Modular Monolith**: 1 repositori, 1 aplikasi container. Frontend hasil build Vite disajikan langsung oleh server Hono.
  - **Clean Architecture (Dependency Inversion)**:
    - `Domain`: Entities, Value Objects, Domain Errors, Repository Interfaces (Murni tanpa dependensi eksternal/ORM).
    - `Application / Services`: Use cases logika bisnis (Hanya bergantung pada interface repository).
    - `Infrastructure`: Implementasi Drizzle ORM, PostgreSQL connection, adapter luar.
    - `Controller / HTTP`: Hono routes, middleware, request/response handlers.

---

## 4. Keamanan Data - Data Tidak Boleh Hilang (`project.md` Bagian 13)

**ATURAN KERAS (Hard Blocker - Pelanggaran = Ditolak):**
1. **Dilarang keras** menjalankan `docker compose down -v`, `docker volume rm`, atau `docker system prune --volumes` pada volume produksi (`ledger_pg_prod`, `ledger_backups`).
2. **Dilarang** menggunakan `drizzle-kit push` di environment produksi. Produksi WAJIB menggunakan migrasi terversi (`drizzle-kit generate` lalu `migrate`).
3. **Dilarang** migrasi destruktif otomatis (`DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, `DELETE` tanpa `WHERE`). Perubahan destruktif harus bertahap (expand -> contract) dan butuh persetujuan manual.
4. **Migrasi TIDAK BOLEH jalan otomatis saat aplikasi start.** Harus dieksekusi secara eksplisit via container `migrate` pada saat deploy.
5. **File migrasi yang sudah dirilis dilarang diedit.** Selalu buat file migrasi baru untuk setiap perubahan schema.
6. **Data bisnis tidak pernah dihapus permanen (Hard Delete dilarang):**
   - Transaksi: Wajib **Soft Delete** (`deleted_at`).
   - Kategori: Wajib status arsip (`is_archived`).
   - Audit Log: **Append-Only** (hanya tambah, tidak pernah diubah atau dihapus).
7. **Guard Lingkungan:** Script seed dan reset database DILARANG jalan jika `APP_ENV=production`.
8. **Backup Wajib Sebelum Migrasi:** Skrip `deploy.sh` wajib melakukan `pg_dump` dan verifikasi integritas file backup sebelum menjalankan migrasi schema database.

---

## 5. Protokol Anti-Halusinasi Agent (`project.md` Bagian 14)

1. **Dilarang Mengarang:** Jangan menebak atau mengarang nama library, fungsi, method, opsi konfigurasi, flag CLI, atau versi. Selalu verifikasi via `package.json`, `bun pm ls`, atau dokumentasi resmi.
2. **Baca Sebelum Menulis:** Selalu buka dan baca isi file aktual sebelum mengubahnya. Jangan mengandalkan ingatan.
3. **Buktikan dengan Output Asli:** Dilarang mengklaim "test lolos", "lint lulus", atau "sudah berjalan" tanpa mengeksekusi perintah dan melampirkan **output konsol asli**.
4. **Dilarang Kode Semu / Placeholder:**
   - Dilarang membuat `// TODO: implement`, `...`, fungsi kosong dummy, atau data tiruan yang disamarkan sebagai implementasi jadi.
   - Dilarang menggunakan `any` atau `@ts-ignore` untuk melewati error compiler/linter.
5. **Kerjakan Bertahap Per Fase:** Ikuti roadmap pengerjaan pada [`project.md`](file:///c:/Users/USER/Documents/Project/CATAT_KEUANGAN/project.md) (Fase 1 sampai Fase 6). Jangan melompati fase tanpa instruksi pengguna.
6. **Checklist Selesai Fase:** Setiap fase harus memenuhi verifikasi dengan bukti output asli:
   - [ ] `bun run lint` dijalankan, output asli dilampirkan
   - [ ] `bun run typecheck` dijalankan, output asli dilampirkan
   - [ ] `bun test` dijalankan, output asli dilampirkan
   - [ ] Docker local berjalan dan `/health` dicek, output dilampirkan
   - [ ] Tidak ada `any`, `@ts-ignore`, atau TODO kosong
   - [ ] Daftar asumsi ditulis eksplisit
7. **Format Laporan Akhir Fase:**
   ```
   Ringkasan: apa yang dikerjakan
   File berubah: daftar path
   Bukti: output lint / typecheck / test / docker
   ASUMSI: ...
   Belum selesai / belum terverifikasi: ...
   Pertanyaan untuk saya: ...
   ```

---

## 6. Standar Desain & UI/UX (`design.md`)

- **Palette Warna (Airbnb-inspired):**
  - Canvas / Background: `#ffffff`
  - Text Utama (Ink): `#222222` (bukan hitam pekat `#000000`)
  - Accent / Primary CTA: Rausch `#ff385c` (Active: `#e00b41`, Disabled: `#ffd1da`)
  - Surface Soft: `#f7f7f7`, Surface Strong: `#f2f2f2`
  - Hairline / Border: `#dddddd`, Hairline Soft: `#ebebeb`, Border Strong: `#c1c1c1`
  - Semantic Error: `#c13515`
  - Star / Rating: Menggunakan warna Ink `#222222` (bukan kuning)
- **Tipografi:**
  - Font: `Airbnb Cereal VF` dengan fallback `Inter, Circular, sans-serif`.
  - Bobot display proporsional (500–700), body 400.
  - Rating display: 64px / 700 sebagai trust signal utama.
- **Bentuk & Radius:**
  - Tombol: 8px (`rounded-lg` / `rounded-[8px]`)
  - Card: 14px (`rounded-xl` / `rounded-[14px]`)
  - Pill Search / Filter: `rounded-full`
  - Touch target minimal 48×48px untuk CTA utama di mobile.
- **Elevation / Bayangan:**
  - Maksimal 1 tingkat shadow halus: `box-shadow: rgba(0, 0, 0, 0.02) 0 0 0 1px, rgba(0, 0, 0, 0.04) 0 2px 6px 0, rgba(0, 0, 0, 0.1) 0 4px 8px 0`. Selebihnya flat.
- **Prinsip Mobile-First:**
  - Mengingat aplikasi ini adalah catatan keuangan harian untuk pasangan yang diakses lewat HP, tata letak responsif mobile (<744px) adalah prioritas kenyamanan utama.

