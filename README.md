# Couple Ledger (Catatan Harian Berdua) 💑📊

> **Aplikasi Pencatatan Keuangan Harian Khusus Pasangan (Mobile-First Web PWA)**  
> Dibangun dengan arsitektur **Modular Monolith**, Clean Architecture, dan prinsip ketat **Keamanan Data (Data Tidak Boleh Hilang)** serta **Anti-Halusinasi**.

---

## 🌟 Fitur Utama

1. **Ruang Keuangan Berdua (Household Multi-Tenancy):**
   - 1 household dibatasi maksimal **2 anggota** (Kamu + Pasangan).
   - Kode undangan 8-karakter unik untuk mengundang pasangan bergabung dalam 1 klik.
2. **Pencatatan Cepat & Transparan:**
   - Bottom sheet catat cepat dengan preset nominal (+10rb, +25rb, +50rb, +100rb, dll.).
   - Kategorisasi pengeluaran & pemasukan, pemilih dompet (*Kas Tunai, Rekening Bank, E-Wallet*), dan catatan harian.
   - Setiap transaksi menampilkan siapa pencatatnya secara transparan.
3. **Keamanan Data Tanpa Hapus Permanen:**
   - **Soft Delete** (`deleted_at`) untuk transaksi.
   - Status **Arsip** (`is_archived`) untuk dompet dan kategori.
   - **Append-Only Audit Trail (Jejak Perubahan):** Seluruh aksi tambah, ubah, dan hapus tercatat permanen dengan metadata aktor, timestamp, nilai sebelum & sesudah.
4. **Batas Anggaran & Peringatan Otomatis (Budgeting):**
   - Atur batas pengeluaran bulanan.
   - Deteksi dan alert otomatis jika pemakaian mencapai **80%** (peringatan) dan **100%** (*overbudget*).
5. **Analitik & Grafik Visual (Airbnb-Inspired Design):**
   - Donut chart distribusi pengeluaran per kategori.
   - Bar chart perbandingan arus kas pemasukan vs pengeluaran.
   - **Indeks Keterbukaan Berdua:** Persentase perbandingan porsi pencatatan antara kamu dan pasangan.
6. **Notifikasi Telegram Real-Time:**
   - Input transaksi 100% via Web.
   - Telegram bot bertindak sebagai **notifikasi pendengar (notifier)**: saat kamu mencatat, notifikasi terkirim ke Telegram pasangan.
   - Mengabaikan notifikasi ke diri sendiri dan mematuhi **Jam Tenang (Quiet Hours)**: 22:00 – 07:00 WIB (Asia/Jakarta).

---

## 🏗️ Tech Stack & Arsitektur

| Komponen | Teknologi |
|---|---|
| **Runtime & Package Manager** | [Bun](https://bun.sh/) (v1.2+) |
| **Bahasa** | TypeScript (`strict: true`) |
| **Backend Framework** | [Elysia](https://elysiajs.com/) (Native Bun, Clean Architecture) |
| **Database** | PostgreSQL 16 (di Docker) |
| **ORM & Migrasi** | [Drizzle ORM](https://orm.drizzle.team/) (Migrasi terversi) |
| **Frontend Client** | React 18, Vite, TanStack Query, Tailwind CSS, Recharts, Lucide Icons |
| **Desain UI/UX** | Airbnb-inspired design system (`design.md`: Canvas `#ffffff`, Ink `#222222`, Rausch `#ff385c`) |
| **Containerization** | Docker & Docker Compose (Multi-stage Monolith Image) |

---

## 🚀 Panduan Memulai Cepat (Local Development)

### 1. Prasyarat
- [Bun](https://bun.sh/) terinstal di mesin lokal (`>= 1.2`)
- [Docker](https://www.docker.com/) & Docker Compose

### 2. Kloning & Instalasi Dependensi
```bash
git clone <repo-url> catat_keuangan
cd catat_keuangan

# Instal dependensi monorepo
bun install
```

### 3. Konfigurasi Environment Development
File `.env.dev` sudah disediakan untuk lingkungan pengembangan lokal:
```ini
APP_ENV=development
NODE_ENV=development
PORT=3000
DB_PORT=5436
WEB_PORT=5174
POSTGRES_USER=ledger_dev
POSTGRES_PASSWORD=ledger_dev_password
POSTGRES_DB=couple_ledger_dev
DATABASE_URL=postgresql://ledger_dev:ledger_dev_password@localhost:5436/couple_ledger_dev
APP_SECRET=dev_super_secret_key_at_least_32_characters_long
WEB_URL=http://localhost:5174
```

### 4. Menjalankan Docker Dev
```bash
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d --build
```
Aplikasi siap diakses pada:
- **Mobile Web:** [http://localhost:5174](http://localhost:5174)
- **Backend API & Swagger:** [http://localhost:3000/swagger](http://localhost:3000/swagger)
- **Database PostgreSQL:** `localhost:5436`

### 5. Menjalankan Database Seed & Reset (Development Only)
```bash
# Menambahkan 18 kategori bawaan
bun run db:seed

# Mengosongkan database lokal (CASCADE)
bun run db:reset:local
```
*(Catatan: Script seed dan reset dilindungi Hard Guard dan akan menolak berjalan jika `APP_ENV=production`).*

---

## 🧪 Pengujian & Verifikasi Kualitas Kode

Setiap modul dilengkapi suite pengujian otomatis (`bun test`):
```bash
# 1. Typecheck seluruh workspace (shared, api, web)
bun run typecheck

# 2. Linter compiler
bun run lint

# 3. Menjalankan seluruh test suite otomatis (41 tests, 11 files)
bun test

# 4. Build produksi client web
bun run --filter web build
```

---

## 🛡️ Kebijakan Keamanan Data & Disaster Recovery

Sesuai aturan ketat pada `project.md` Bagian 13:
1. **Named Volumes Eksternal:**
   Volume produksi (`ledger_pg_prod` dan `ledger_backups`) bertipe `external: true`, sehingga kebal terhadap perintah `docker compose down -v`.
2. **Anti-Destructive Migration:**
   Dilarang menggunakan `drizzle-kit push` di produksi. Seluruh perubahan skema wajib melalui file migrasi terversi (`db/migrations/`).
3. **Backup Otomatis Harian:**
   Container `backup` berjalan setiap 24 jam melakukan `pg_dump` terkompresi gzip dengan kebijakan retensi: **14 harian**, **8 mingguan**, dan **6 bulanan**.
4. **Verifikasi Integritas:**
   Setiap hasil dump diuji dengan `gzip -t` sebelum dicatat ke `backup.log`.

---

## 🚢 Prosedur Deployment Produksi

### 1. Buat Named Volumes Persisten (Cukup 1 Kali di Server)
```bash
docker volume create ledger_pg_prod
docker volume create ledger_backups
```

### 2. Salin dan Isi Konfigurasi Produksi
```bash
cp .env.prod.example .env.prod
nano .env.prod
```

### 3. Eksekusi Script Deploy Otomatis
Script `./scripts/deploy.sh` menjalankan 7 langkah keamanan deployment:
1. Validasi keberadaan file `.env.prod` dan image Docker.
2. Backup database otomatis sebelum migrasi.
3. Menjalankan migrasi database terversi (`docker compose run --rm migrate`).
4. Jika migrasi gagal, deployment berhenti seketika tanpa mengubah aplikasi yang berjalan.
5. Menjalankan container aplikasi versi baru.
6. Memverifikasi status kesehatan endpoint `/health`. Jika gagal, otomatis melakukan rollback ke image versi stabil sebelumnya.
7. Mencatat log riwayat deployment ke `deploy.log`.

```bash
# Contoh deploy versi 0.1.0
./scripts/deploy.sh 0.1.0
```

---

## 📦 Prosedur Restore Database & Bukti Uji Coba

> *"Backup yang belum pernah dites restore dianggap tidak ada." (project.md Bagian 13.4)*

### Cara Restore
```bash
./scripts/restore.sh /path/ke/ledger_backup_YYYYMMDD_HHMMSSZ.sql.gz
```
Script `restore.sh` bekerja dengan aman:
1. Memverifikasi integritas arsip dengan `gzip -t`.
2. Memulihkan file dump ke database pengujian sementara (`couple_ledger_restore_test`) terlebih dahulu.
3. Memverifikasi jumlah tabel dan data.
4. Meminta konfirmasi manual (mengetik `RESTORE`) sebelum menimpa database utama.

### Bukti Hasil Uji Coba Restore Nyata:
```text
🔍 1. Memeriksa integritas file backup...
INTEGRITY_OK
✅ File backup valid.

🧪 2. Menjalankan Uji Coba Restore ke Database Sementara (couple_ledger_restore_test)...
CREATE DATABASE
 category_count 
----------------
             18
(1 row)

 transaction_count 
-------------------
                35
(1 row)

DROP DATABASE
RESTORE_TEST_SUCCESS
```

---

## 🤖 Integrasi Bot Telegram

1. Buka Bot Telegram yang telah Anda buat di BotFather.
2. Di aplikasi web Couple Ledger, masuk ke tab **Setelan** -> **Telegram**.
3. Klik tombol **Hubungkan Akun Telegram** untuk menghasilkan token deep link (berlaku 10 menit).
4. Klik tautan yang muncul atau kirim pesan `/start <token>` ke bot Telegram Anda.
5. Bot akan mengonfirmasi bahwa akun Telegram Anda telah terhubung ke ruang keuangan bersama pasangan.
6. Perintah yang tersedia di bot:
   - `/status` : Melihat status koneksi dan jam tenang.
   - `/mute`   : Menonaktifkan notifikasi sementara.
   - `/unmute` : Mengaktifkan kembali notifikasi.

---

## 📜 Lisensi
Hak Cipta © 2026 Couple Ledger Project. Dilindungi undang-undang.

