# PROJECT SPEC: Couple Ledger (Catatan Harian Berdua)

> File ini adalah sumber kebenaran untuk agent Antigravity.
> Baca seluruh file sebelum menulis kode. Kerjakan per fase, jangan loncat.

---

## 1. Analisa Kebutuhan

### 1.1 Ringkasan
Aplikasi pencatatan harian untuk **dua orang (user + pasangan)** yang saling mencatat di ruang bersama. Hasilnya bisa dilihat sebagai dashboard, grafik bulanan per kategori, dan riwayat.

### 1.2 Asumsi (ubah di sini kalau salah)
| # | Asumsi | Alasan |
|---|--------|--------|
| A1 | Catatan = **catatan keuangan** (pemasukan & pengeluaran) | "Grafik per kategori" paling natural untuk uang |
| A2 | Uang disimpan **integer Rupiah**, tanpa desimal | Hindari bug floating point |
| A3 | 1 *household* = maksimal **2 anggota** | Kasus pasangan |
| A4 | Kedua anggota **melihat semua** catatan, dan tiap catatan menampilkan siapa pencatatnya | Tujuan "saling catat" |
| A5 | "Evident" = **audit trail** (siapa ubah apa, kapan, nilai sebelum/sesudah) + **log error terstruktur** dengan request ID | Supaya setiap kejadian ada jejaknya |
| A6 | Edit/hapus boleh oleh kedua anggota, tapi **selalu tercatat** di audit log | Saling percaya, tapi transparan |
| A7 | Hapus = **soft delete** | Data tidak pernah hilang, audit tetap utuh |
| A8 | Web responsive (mobile-first), bukan native app | Paling cepat jalan di HP berdua |
| A9 | Aplikasi berbentuk **monolith** (bukan microservice, bukan 2 repo terpisah) | Dipakai 2 orang, kompleksitas harus minimal |
| A10 | Data **tidak boleh hilang**: volume persisten, backup otomatis, migrasi aman (Bagian 13) | Permintaan eksplisit |
| A11 | Agent **dilarang berhalusinasi** dan wajib mengikuti aturan Bagian 14 | Permintaan eksplisit |

### 1.3 Fitur
1. **Auth**: register, login, logout, refresh token, ganti password.
2. **Household**: buat ruang, undang pasangan lewat kode undangan, maksimal 2 anggota.
3. **Catatan harian (transaksi)**: tambah, ubah, hapus, lihat detail.
4. **Kategori**: default bawaan plus bisa tambah/arsip sendiri.
5. **Dashboard**: ringkasan bulan berjalan.
6. **Grafik bulanan per kategori**: stacked bar 12 bulan dan donut per bulan.
7. **Riwayat**: daftar transaksi dengan filter, plus tab **Jejak Perubahan** (audit log).
8. **Evidence**: audit log + error log, bisa dilihat di UI.

### 1.4 Saran Kategori Default

**Pengeluaran**
| Kategori | Contoh |
|----------|--------|
| Makan & Minum | makan luar, kopi, jajan |
| Belanja Harian | sembako, pasar, minimarket |
| Transportasi | bensin, parkir, ojol, tol |
| Tagihan & Utilitas | listrik, air, internet, pulsa |
| Hunian | sewa/KPR, perabot, perbaikan |
| Kesehatan | obat, dokter, asuransi |
| Hiburan & Hobi | nonton, game, langganan |
| Belanja Pribadi | baju, skincare, gadget |
| Sosial & Hadiah | kondangan, sedekah, kado |
| Pendidikan | kursus, buku |
| Cicilan & Hutang | cicilan, kartu kredit |
| Tabungan & Investasi | tabungan, reksa dana, dana darurat |
| Lainnya | di luar kategori |

**Pemasukan**: Gaji, Bonus, Usaha/Freelance, Hadiah Masuk, Lainnya.

---

## 2. Tech Stack

| Lapisan | Pilihan |
|---------|---------|
| Runtime & package manager | **Bun** |
| Bahasa | **TypeScript** (`strict: true`) |
| Backend framework | **Hono** (ringan, native di Bun) |
| Validasi | **Zod** |
| ORM | **Drizzle ORM** |
| Database | **PostgreSQL 16** (di Docker, local dan prod sama persis supaya tidak ada beda perilaku) |
| Auth | Password **Argon2id** (`Bun.password`), **JWT access token** (15 menit) + **refresh token** di httpOnly cookie (rotasi) |
| Logging | **pino** (JSON terstruktur) |
| Test | `bun test` |
| Lint/format | ESLint + Prettier |
| Frontend | **React + Vite + TypeScript**, TanStack Query, Tailwind, Recharts |
| Gaya arsitektur | **Modular Monolith**: 1 repo, 1 aplikasi, 1 container deploy. Frontend hasil build disajikan oleh server Hono (lihat Bagian 12) |
| Container | **Docker + Docker Compose**: 2 konfigurasi terpisah, `local` dan `prod` |

---

## 3. Arsitektur (Clean Architecture + Repository + Service)

```
Controller (HTTP)  ->  Service (use case)  ->  Repository (interface)  <-  Infrastructure (Drizzle)
                              |
                           Domain (entity, value object, error)
```

**Aturan dependensi**: panah hanya menunjuk ke dalam. Domain tidak boleh import apa pun dari luar. Service hanya tahu **interface** repository, tidak tahu Drizzle.

### 3.1 Struktur folder backend (`src/server`)
```
domain/
  entities/         User, Household, Transaction, Category, AuditLog
  value-objects/    Money, YearMonth, Email
  errors/           AppError, NotFoundError, ValidationError, ForbiddenError, ConflictError
  repositories/     (interface saja) UserRepository, TransactionRepository, ...
application/
  services/
    auth/           RegisterUserService, LoginService, RefreshTokenService, LogoutService
    household/      CreateHouseholdService, JoinHouseholdService
    transaction/    CreateTransactionService, UpdateTransactionService, DeleteTransactionService, ListTransactionsService
    category/       CreateCategoryService, ArchiveCategoryService, ListCategoriesService
    report/         GetDashboardSummaryService, GetMonthlyByCategoryService, GetMonthlyTrendService
    audit/          RecordAuditService, ListAuditLogsService
  ports/            PasswordHasher, TokenIssuer, Clock, IdGenerator, Logger
infrastructure/
  database/         schema.ts, client.ts, migrations/
  repositories/     DrizzleUserRepository, DrizzleTransactionRepository, ...
  security/         BunPasswordHasher, JwtTokenIssuer
  logging/          PinoLogger
presentation/
  http/
    controllers/    AuthController, TransactionController, ...
    middlewares/    authGuard, requestId, errorHandler, rateLimit
    dto/            schema Zod request/response
    routes.ts
main/
  container.ts      Composition root (satu-satunya tempat `new` dependensi)
  server.ts
```

### 3.2 Aturan Kode (WAJIB)

**Clean code**
- Nama jelas dan berbahasa Inggris. Tidak ada singkatan aneh (`usr`, `tmp`, `data2`).
- **1 fungsi = 1 proses**. Fungsi maksimal ~20 baris. Kalau ada kata "dan" pada deskripsi fungsi, pecah.
- Maksimal 3 parameter. Lebih dari itu pakai satu objek bertipe.
- Tidak ada `any`. Tidak ada `as` kecuali terpaksa dan diberi komentar alasan.
- Tidak ada magic number/string. Pakai `const` atau `enum`.
- Early return, hindari nested `if` lebih dari 2 level.
- Komentar menjelaskan **kenapa**, bukan **apa**.

**SOLID**
- **S**: 1 service = 1 use case (`CreateTransactionService` hanya membuat transaksi).
- **O**: tambah perilaku lewat implementasi interface baru, bukan edit kode lama.
- **L**: semua implementasi repository harus bisa saling menggantikan.
- **I**: interface kecil dan spesifik (pisahkan `TransactionReader` dan `TransactionWriter` bila perlu).
- **D**: service bergantung pada interface, dependensi di-inject lewat constructor.

**Pola per use case**
```ts
export class CreateTransactionService {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly categories: CategoryRepository,
    private readonly audit: RecordAuditService,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateTransactionInput): Promise<Transaction> {
    await this.ensureCategoryBelongsToHousehold(input);
    const transaction = this.buildTransaction(input);
    await this.transactions.save(transaction);
    await this.audit.record(this.toAuditEntry(transaction));
    return transaction;
  }
  // private method kecil, masing-masing satu tugas
}
```

**Error handling**
- Lempar `AppError` bertipe dari domain/service. Jangan `throw new Error("...")` polos.
- Satu `errorHandler` middleware yang memetakan `AppError` ke HTTP status dan format respons seragam.
- Format error: `{ "error": { "code": "TRANSACTION_NOT_FOUND", "message": "...", "requestId": "..." } }`
- Jangan pernah membocorkan stack trace atau detail DB ke client.

**Controller**
- Hanya: parse request (Zod) -> panggil 1 service -> kembalikan response. Tanpa logika bisnis.

**Repository**
- Hanya akses data. Tanpa logika bisnis. Mengembalikan entity domain, bukan row Drizzle mentah.

---

## 4. Evidence (Audit & Error Trail)

### 4.1 Audit log (append-only)
Dicatat otomatis untuk: register, login berhasil/gagal, logout, join household, create/update/delete transaksi, create/archive kategori, ganti password.

| Kolom | Isi |
|-------|-----|
| id | uuid |
| household_id | nullable |
| actor_id | siapa pelakunya |
| action | mis. `TRANSACTION_UPDATED` |
| entity_type / entity_id | objek yang berubah |
| before / after | JSON snapshot (diff) |
| request_id | korelasi dengan log server |
| ip / user_agent | asal request |
| created_at | waktu (UTC) |

Aturan: tabel ini **tidak punya** endpoint update/delete. Repository hanya punya `append()` dan `list()`.

### 4.2 Error log & observability
- Setiap request dapat `requestId` (header `x-request-id`), dikembalikan di respons.
- Semua error 5xx dan error tak terduga dicatat via pino dengan `requestId`, `userId`, route, dan stack trace.
- Tabel `error_logs` menyimpan error 5xx supaya bisa ditelusuri tanpa buka server.
- Di UI: halaman **Jejak Perubahan** menampilkan audit log, dan toast error menampilkan `requestId` supaya gampang dilaporkan.

---

## 5. Model Data

```
users(id, name, email UNIQUE, password_hash, created_at)
households(id, name, invite_code UNIQUE, created_at)
household_members(household_id, user_id, role[OWNER|MEMBER], joined_at)   -- UNIQUE(household_id, user_id), max 2 per household
categories(id, household_id NULL=default, name, type[EXPENSE|INCOME], icon, color, is_archived)
transactions(id, household_id, created_by, category_id, type, amount_idr INT, note, occurred_on DATE,
             created_at, updated_at, deleted_at NULL)
audit_logs(id, household_id, actor_id, action, entity_type, entity_id, before JSON, after JSON,
           request_id, ip, user_agent, created_at)
refresh_tokens(id, user_id, token_hash, expires_at, revoked_at, user_agent, created_at)
error_logs(id, request_id, user_id, route, message, stack, created_at)
```

Index penting: `transactions(household_id, occurred_on)`, `transactions(household_id, category_id, occurred_on)`, `audit_logs(household_id, created_at)`.

---

## 6. API (prefix `/api/v1`)

| Method | Path | Fungsi |
|--------|------|--------|
| POST | /auth/register | daftar |
| POST | /auth/login | login |
| POST | /auth/refresh | rotasi refresh token |
| POST | /auth/logout | cabut refresh token |
| POST | /auth/change-password | ganti password |
| POST | /households | buat ruang |
| POST | /households/join | gabung pakai invite code |
| GET | /households/me | info ruang + anggota |
| GET/POST | /categories | list / buat |
| PATCH | /categories/:id/archive | arsipkan |
| GET/POST | /transactions | list (filter + cursor pagination) / buat |
| GET/PATCH/DELETE | /transactions/:id | detail / ubah / soft delete |
| GET | /reports/dashboard?month=2026-10 | ringkasan dashboard |
| GET | /reports/monthly-by-category?year=2026 | data stacked bar 12 bulan |
| GET | /reports/category-breakdown?month=2026-10 | data donut |
| GET | /audit-logs | jejak perubahan (filter + pagination) |

Semua endpoint selain `/auth/*` wajib `authGuard`, dan semua query otomatis dibatasi ke `household_id` milik user (cegah kebocoran data antar household).

---

## 7. Desain Layar

### 7.1 Dashboard (bulan berjalan, ada pemilih bulan)
- Kartu: **Pemasukan**, **Pengeluaran**, **Saldo**, plus selisih % vs bulan lalu.
- **Donut** pengeluaran per kategori.
- **Bar harian** pengeluaran sepanjang bulan.
- **Kontribusi per orang**: berapa yang dicatat kamu vs pasangan.
- **Top 3 kategori** terboros.
- 5 transaksi terakhir + tombol cepat **"+ Catat"**.

### 7.2 Grafik Bulanan per Kategori
- **Stacked bar** 12 bulan (sumbu X = bulan, warna = kategori), pilih tahun.
- Klik satu bulan membuka **donut + tabel** rincian kategori bulan itu.
- Toggle: Pengeluaran / Pemasukan, Semua / per orang.

### 7.3 Riwayat
- Tab 1 **Transaksi**: list dikelompokkan per tanggal, filter (bulan, kategori, orang, tipe, kata kunci), infinite scroll.
- Tab 2 **Jejak Perubahan**: audit log, tampil "Pasangan mengubah Makan Siang dari 25.000 menjadi 30.000, 12 Okt 14:02".
- Tiap item bisa dibuka untuk edit/hapus (konfirmasi sebelum hapus).

### 7.4 Form Catat (mobile-first, maksimal 4 field utama)
Nominal, Kategori, Tanggal (default hari ini), Catatan (opsional).

---

## 8. Keamanan
- Argon2id untuk password. Minimal 8 karakter.
- Refresh token disimpan **hash**-nya, dirotasi tiap pakai, bisa dicabut.
- Cookie `httpOnly`, `secure`, `sameSite=lax`.
- Rate limit di `/auth/*` (anti brute force).
- CORS whitelist, header keamanan, validasi semua input dengan Zod.
- Otorisasi di **service** (cek household), bukan hanya di controller.
- Secret hanya dari environment variable (`.env`, tidak di-commit; sediakan `.env.example`).

---

## 9. Rencana Kerja per Fase

Tiap fase selesai kalau **Definition of Done** terpenuhi. Agent berhenti dan minta review di akhir tiap fase.

### Fase 0: Fondasi
- Struktur monolith, tsconfig strict, ESLint, Prettier, struktur folder, `container.ts`, errorHandler, requestId, logger.
- **Docker**: `Dockerfile`, `docker-compose.local.yml`, `docker-compose.prod.yml`, script backup/restore/deploy (Bagian 12 dan 13).
- **DoD**: `bun run lint`, `bun run typecheck`, `bun test` lolos; `docker compose -f docker-compose.local.yml up` menjalankan app + DB; endpoint `/health` jalan; skenario restart container terbukti **tidak menghilangkan data**.

### Fase 1: Auth + Household
- Register, login, refresh, logout, ganti password, buat/join household (maks 2 anggota).
- **DoD**: unit test service (happy path + gagal), audit log tercatat untuk tiap aksi auth.

### Fase 2: Kategori + Transaksi
- Seed kategori default, CRUD transaksi, soft delete, validasi kategori milik household.
- **DoD**: test repository + service, user lain tidak bisa mengakses data household lain (ada test-nya).

### Fase 3: Riwayat + Audit
- List transaksi dengan filter + cursor pagination, endpoint audit log, snapshot before/after.
- **DoD**: setiap create/update/delete menghasilkan 1 audit entry yang benar.

### Fase 4: Laporan + Dashboard
- Tiga endpoint reports, query agregasi di repository, UI dashboard dan grafik.
- **DoD**: angka dashboard sama dengan penjumlahan manual di test dengan data seed.

### Fase 5: Frontend lengkap + Hardening
- Layar login, dashboard, grafik, riwayat, form catat, halaman jejak perubahan, error toast dengan requestId.
- Rate limit, security header, README (cara setup, jalanin, env), seed data demo.
- **DoD**: bisa dipakai end-to-end oleh dua akun berbeda.

---

## 10. Instruksi untuk Agent Antigravity

1. Baca file ini penuh, lalu **buat implementation plan** dulu dan tunggu persetujuan sebelum mengeksekusi.
2. Kerjakan **satu fase per sesi**. Jangan mengerjakan fase berikutnya sebelum fase aktif disetujui.
3. Setiap use case baru wajib: interface repository (bila perlu), service, controller, DTO Zod, dan **test**.
4. Jangan menambah library di luar stack Bagian 2 tanpa menanyakan dulu.
5. Sebelum menyatakan selesai, jalankan `bun run lint && bun run typecheck && bun test` dan lampirkan hasilnya sebagai artifact.
6. Jika ada ketidakjelasan atau konflik dengan asumsi Bagian 1.2, **tanya**, jangan menebak.
7. Commit kecil dan sering dengan pesan konvensional (`feat:`, `fix:`, `refactor:`, `test:`).
8. Patuhi **Bagian 12** (monolith + Docker) dan **Bagian 13** (keamanan data). Pelanggaran terhadap Bagian 13 adalah blocker, hentikan kerja dan laporkan.
9. Patuhi **Bagian 14 (Anti Halusinasi)** di setiap langkah, tanpa pengecualian.

---

## 11. Pertanyaan Terbuka (jawab sebelum Fase 2)
1. Catatan harian ini benar **keuangan**, atau juga mau ada jurnal/diary biasa?
2. Perlu **upload foto struk** sebagai bukti tambahan? (bisa masuk fase tambahan)
3. Perlu fitur **budget bulanan per kategori** dengan peringatan kalau hampir habis?
4. Deploy prod ke mana (VPS sendiri, Railway, Fly.io)? Menentukan lokasi volume dan tujuan backup offsite.
5. Backup offsite mau ke mana (Google Drive, S3/R2, server lain)? Backup lokal di server saja belum cukup kalau disknya rusak.

---

## 12. Monolith & Docker

### 12.1 Prinsip monolith
- **Satu repo, satu aplikasi, satu image Docker** untuk app. Database adalah satu-satunya container pendamping.
- Backend dan frontend dibangun bersama. Hasil build React (`dist/client`) **disajikan oleh server Hono** (`serveStatic`), jadi tidak ada server frontend terpisah dan tidak ada masalah CORS.
- Tetap modular: batas modul dijaga lewat layer Clean Architecture (Bagian 3), bukan lewat pemisahan deployment.
- Dilarang: microservice, message broker, service tambahan di luar app dan DB, kecuali disetujui eksplisit.

### 12.2 Struktur root
```
.
├── src/
│   ├── server/          # backend (struktur Bagian 3.1)
│   ├── client/          # React + Vite
│   └── shared/          # tipe dan schema Zod yang dipakai server dan client
├── drizzle/             # file migrasi (di-commit, tidak boleh diedit setelah dipakai)
├── scripts/
│   ├── backup.sh
│   ├── restore.sh
│   └── deploy.sh
├── Dockerfile
├── docker-compose.local.yml
├── docker-compose.prod.yml
├── .env.local.example
├── .env.prod.example
├── .dockerignore
└── PROJECT_SPEC.md
```
`.env.local` dan `.env.prod` **tidak di-commit** (masuk `.gitignore`), hanya file `*.example`.

### 12.3 Dockerfile (multi-stage, satu file untuk local dan prod)
```dockerfile
# --- deps ---
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# --- build ---
FROM deps AS build
COPY . .
RUN bun run build            # build client (Vite) + typecheck server

# --- runtime (prod) ---
FROM oven/bun:1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/package.json ./package.json
COPY --from=deps  /app/node_modules ./node_modules
USER bun
EXPOSE 3000
HEALTHCHECK CMD bun -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["bun", "dist/server/main/server.js"]
```
> Catatan untuk agent: versi image dan nama file output **harus diverifikasi** terhadap konfigurasi build yang benar-benar dibuat (lihat Bagian 14). Jangan menyalin snippet ini tanpa mencocokkannya.

### 12.4 `docker-compose.local.yml` (pengembangan)
Tujuan: cepat, hot reload, DB bisa diakses dari host untuk debug.
```yaml
services:
  app:
    build:
      context: .
      target: deps                # image dev: ada devDependencies
    command: bun run dev          # hot reload server + Vite
    env_file: .env.local
    ports:
      - "3000:3000"
      - "5173:5173"               # Vite dev server
    volumes:
      - .:/app                    # source code di-mount
      - /app/node_modules         # node_modules container tidak ditimpa host
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    env_file: .env.local
    ports:
      - "127.0.0.1:5432:5432"     # hanya localhost
    volumes:
      - ledger_pg_local:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      timeout: 3s
      retries: 10

volumes:
  ledger_pg_local:
```
- Seed data demo **hanya** boleh jalan di local (`bun run db:seed`), tidak pernah di prod.
- Reset total di local (hapus data) harus lewat perintah eksplisit `bun run db:reset:local` dengan konfirmasi, bukan efek samping.

### 12.5 `docker-compose.prod.yml` (produksi)
Tujuan: stabil, aman, data selamat.
```yaml
services:
  app:
    image: couple-ledger:${APP_VERSION}     # image sudah di-build, bukan build di server
    restart: unless-stopped
    env_file: .env.prod
    ports:
      - "3000:3000"                          # taruh reverse proxy (Caddy/Nginx) + HTTPS di depannya
    depends_on:
      db:
        condition: service_healthy

  migrate:                                   # dijalankan manual saat deploy, bukan otomatis
    image: couple-ledger:${APP_VERSION}
    command: bun run db:migrate
    env_file: .env.prod
    profiles: ["tools"]
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    env_file: .env.prod
    # TIDAK ada `ports:` -> DB tidak bisa diakses dari luar
    volumes:
      - ledger_pg_prod:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 10

  backup:
    image: postgres:16-alpine
    restart: unless-stopped
    env_file: .env.prod
    entrypoint: ["/bin/sh", "/scripts/backup.sh"]   # loop: pg_dump harian + hapus yang lewat retensi
    volumes:
      - ./scripts:/scripts:ro
      - ledger_backups:/backups
    depends_on:
      db:
        condition: service_healthy

volumes:
  ledger_pg_prod:
    external: true       # dibuat manual, TIDAK ikut terhapus oleh `docker compose down -v`
  ledger_backups:
    external: true
```
Buat volume sekali saja di server: `docker volume create ledger_pg_prod && docker volume create ledger_backups`.

### 12.6 Perintah standar
| Tujuan | Perintah |
|--------|----------|
| Jalankan local | `docker compose -f docker-compose.local.yml up --build` |
| Deploy prod | `./scripts/deploy.sh <versi>` |
| Lihat log prod | `docker compose -f docker-compose.prod.yml logs -f app` |
| Backup manual | `./scripts/backup.sh --once` |
| Restore | `./scripts/restore.sh <file.sql.gz>` |

---

## 13. Keamanan Data (Data Tidak Boleh Hilang)

### 13.1 Aturan keras (blocker kalau dilanggar)
1. **Dilarang** `docker compose down -v`, `docker volume rm`, `docker system prune --volumes` terhadap volume prod. Volume prod bersifat `external` untuk mencegah hal ini.
2. **Dilarang** `drizzle-kit push` di prod. Prod hanya pakai migrasi terversi (`drizzle-kit generate` lalu `migrate`).
3. **Dilarang** migrasi destruktif otomatis (`DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, `DELETE` tanpa `WHERE`). Perubahan destruktif dilakukan bertahap (expand lalu contract) dan butuh persetujuan manual.
4. Migrasi **tidak jalan otomatis saat app start**. Dijalankan eksplisit lewat service `migrate` saat deploy.
5. File migrasi yang sudah dipakai **tidak boleh diedit**. Perubahan = migrasi baru.
6. Data bisnis **tidak pernah dihapus permanen** lewat aplikasi: transaksi pakai soft delete, kategori pakai arsip, audit log append-only.
7. Seed dan reset hanya untuk local. Ada guard di kode: kalau `APP_ENV=production`, perintah seed/reset langsung menolak jalan.

### 13.2 Persistensi
- Data PostgreSQL berada di **named volume** (`ledger_pg_prod`), bukan di dalam container, jadi restart, rebuild, dan upgrade image tidak menghapus data.
- `restart: unless-stopped` agar pulih sendiri setelah crash atau reboot server.
- Healthcheck pada DB dan app; app baru start setelah DB sehat.

### 13.3 Backup
- Container `backup` menjalankan `pg_dump` **harian** (`--format=custom` atau `.sql.gz`) ke volume `ledger_backups`.
- Retensi: 14 harian + 8 mingguan + 6 bulanan. File lama dihapus oleh skrip, file baru tidak pernah menimpa yang lama (nama berisi timestamp UTC).
- **Backup wajib otomatis dijalankan sebelum setiap migrasi** (di dalam `deploy.sh`).
- **Offsite**: salin backup ke luar server (target ditentukan di pertanyaan terbuka no. 5). Backup yang hanya ada di server yang sama bukan backup.
- Setelah backup selesai, skrip memverifikasi file tidak kosong (`gzip -t` / `pg_restore --list`) dan mencatat hasilnya ke log.

### 13.4 Restore dan pembuktian
- `restore.sh` memulihkan dump ke database **sementara** dulu untuk verifikasi, baru (dengan konfirmasi manual) ke database utama.
- **Backup yang belum pernah dites restore dianggap tidak ada.** Fase 5 wajib mencakup satu uji restore penuh dan hasilnya dicatat di README.

### 13.5 `deploy.sh` (urutan wajib)
```
1. Validasi: .env.prod ada, versi diberikan, image tersedia
2. Backup database -> verifikasi file backup
3. Jalankan migrasi: docker compose run --rm migrate
4. Jika migrasi gagal -> STOP, jangan ganti app, tampilkan lokasi backup
5. docker compose up -d app
6. Tunggu /health OK -> jika gagal, rollback ke image versi sebelumnya
7. Catat hasil deploy (versi, waktu, hasil) ke log
```
Rollback hanya mengganti image app. Database tidak pernah di-rollback otomatis; restore dari backup butuh keputusan manual.

### 13.6 Evidence untuk data
Audit log (Bagian 4) dan log deploy/backup melengkapi jejak: siapa mengubah data, kapan backup terakhir sukses, versi mana yang berjalan.

---

## 14. Anti Halusinasi (WAJIB untuk agent)

### 14.1 Prinsip
Lebih baik bilang **"saya tidak tahu / belum diverifikasi"** daripada mengarang. Kode yang kelihatan benar tapi tidak pernah dijalankan dianggap **belum selesai**.

### 14.2 Aturan
1. **Jangan mengarang** nama library, fungsi, method, opsi konfigurasi, flag CLI, atau versi. Kalau tidak yakin, cek dokumentasi resmi (browser/search), `package.json`, atau lihat kode `node_modules` yang terpasang.
2. **Baca sebelum menulis**: sebelum mengubah file, buka dan baca isi aktualnya. Jangan mengandalkan ingatan tentang isi file.
3. **Verifikasi versi**: sebelum memakai API library, pastikan versi terpasang (`bun pm ls` atau `package.json`) dan API itu memang ada di versi tersebut. Jangan mencampur API versi lama dan baru.
4. **Jangan mengklaim hasil yang tidak dijalankan.** Dilarang menulis "test lolos", "build sukses", "sudah berjalan" tanpa menjalankan perintahnya dan melampirkan **output asli** (bukan ringkasan karangan).
5. **Tidak ada kode semu**: dilarang placeholder seperti `// TODO implement`, `...`, fungsi kosong, atau data palsu yang disamarkan sebagai implementasi. Kalau belum bisa dikerjakan, tulis eksplisit apa yang belum dan kenapa.
6. **Pisahkan fakta dan asumsi.** Setiap asumsi diberi label `ASUMSI:` dan ditaruh di ringkasan akhir. Fakta harus punya sumber (file, baris, dokumen, output perintah).
7. **Jangan mengarang data pengguna atau data uji sebagai kenyataan.** Data contoh harus jelas diberi label demo dan hanya di seed local.
8. **Jangan menambah fitur, library, atau file di luar lingkup** fase aktif dan stack Bagian 2 tanpa bertanya.
9. **Konflik atau ambiguitas = bertanya**, bukan menebak. Jika spec ini bertentangan dengan dirinya sendiri, laporkan kontradiksinya.
10. **Jangan menyembunyikan kegagalan.** Error, test gagal, warning penting, atau langkah yang dilewati harus dilaporkan apa adanya, jangan "diperbaiki" dengan mematikan test, melonggarkan tipe, atau menambah `any`/`@ts-ignore`.
11. **Jangan menyimpulkan perilaku database/Docker dari asumsi.** Jalankan dan amati (`docker compose config`, `docker compose ps`, query nyata) sebelum menyatakan konfigurasi benar.
12. **Snippet di spec ini adalah arahan, bukan kode final.** Cocokkan dengan kondisi proyek nyata sebelum dipakai, dan laporkan jika ada yang tidak sesuai.

### 14.3 Checklist sebelum menyatakan satu fase selesai
Agent wajib menyertakan checklist ini di artifact akhir, lengkap dengan bukti:

- [ ] `bun run lint` dijalankan, output asli dilampirkan
- [ ] `bun run typecheck` dijalankan, output asli dilampirkan
- [ ] `bun test` dijalankan, output asli dilampirkan
- [ ] Docker local di-`up` dan `/health` dicek, output dilampirkan
- [ ] Semua library/API yang dipakai terverifikasi ada di versi terpasang
- [ ] Tidak ada `any`, `@ts-ignore`, TODO kosong, atau kode placeholder
- [ ] Daftar **ASUMSI** ditulis eksplisit (atau "tidak ada")
- [ ] Daftar hal yang **belum selesai / tidak bisa diverifikasi** ditulis eksplisit (atau "tidak ada")
- [ ] Tidak ada pelanggaran aturan keras Bagian 13

### 14.4 Format laporan akhir tiap fase
```
Ringkasan: apa yang dikerjakan
File berubah: daftar path
Bukti: output lint / typecheck / test / docker
ASUMSI: ...
Belum selesai / belum terverifikasi: ...
Pertanyaan untuk saya: ...
```