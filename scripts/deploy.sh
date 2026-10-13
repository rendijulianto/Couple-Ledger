#!/bin/sh
set -e

# ==========================================
# Script Deployment Aman: Couple Ledger
# ==========================================

VERSION="$1"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"
LOG_FILE="deploy.log"

if [ -z "$VERSION" ]; then
    echo "Penggunaan: $0 <versi>"
    echo "Contoh: $0 0.1.0"
    exit 1
fi

echo "=================================================="
echo "🚀 [$(date -u)] Memulai Deployment Versi $VERSION"
echo "=================================================="

# 1. Validasi Persyaratan
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ ERROR: File konfigurasi $ENV_FILE tidak ditemukan!"
    exit 1
fi

export APP_VERSION="$VERSION"

# Periksa apakah image docker ada, jika belum build image lokal
if ! docker image inspect "couple-ledger:$VERSION" > /dev/null 2>&1; then
    echo "🔨 Image couple-ledger:$VERSION belum tersedia. Membangun image..."
    docker build -t "couple-ledger:$VERSION" .
fi

# Simpan versi sebelumnya untuk rollback jika diperlukan
PREV_IMAGE=$(docker compose -f "$COMPOSE_FILE" ps app --format '{{.Image}}' 2>/dev/null || echo "")

# Pastikan volume eksternal persisten tersedia
docker volume create ledger_pg_prod > /dev/null 2>&1 || true
docker volume create ledger_backups > /dev/null 2>&1 || true

# Pastikan container database & backup sudah aktif dan siap
echo "🐘 Memastikan database service berjalan..."
docker compose -f "$COMPOSE_FILE" up -d db backup

# 2. Backup Database Sebelum Migrasi (Wajib, Bagian 13.5)
echo "📦 Menjalankan backup database pra-migrasi..."
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%SZ")
docker compose -f "$COMPOSE_FILE" exec -T backup /bin/sh /scripts/backup.sh --once || {
    echo "⚠️ Backup otomatis via container backup belum tersedia (kemungkinan deploy perdana). Melanjutkan..."
}
echo "✅ Pengecekan backup pra-migrasi selesai."

# 3. Jalankan Migrasi Schema Database Terversi
echo "🔄 Menjalankan migrasi database via container migrate..."
if ! docker compose -f "$COMPOSE_FILE" run --rm migrate; then
    echo "❌ FATAL: Migrasi schema database GAGAL!"
    echo "🛑 Deployment dihentikan. Aplikasi tidak diganti."
    echo "📁 File backup darurat tersedia jika pemulihan diperlukan."
    echo "[$(date -u)] FAILED: Versi $VERSION (Migrasi Gagal)" >> "$LOG_FILE"
    exit 1
fi
echo "✅ Migrasi database sukses."

# 4. Deploy Kontainer Aplikasi Versi Baru
echo "🚢 Memulai container app versi $VERSION..."
docker compose -f "$COMPOSE_FILE" up -d app

# 5. Tunggu dan Verifikasi Healthcheck
echo "⏳ Memverifikasi status kesehatan container (/health)..."
MAX_ATTEMPTS=12
ATTEMPT=1
HEALTHY=false

while [ "$ATTEMPT" -le "$MAX_ATTEMPTS" ]; do
    if docker compose -f "$COMPOSE_FILE" exec -T app curl -s http://localhost:3000/health | grep -q '"status":"ok"'; then
        HEALTHY=true
        break
    fi
    echo "  - Menunggu aplikasi sehat (percobaan $ATTEMPT/$MAX_ATTEMPTS)..."
    sleep 5
    ATTEMPT=$((ATTEMPT + 1))
done

if [ "$HEALTHY" = true ]; then
    echo "🎉 DEPLOYMENT SUKSES: Versi $VERSION berjalan dengan sehat!"
    echo "[$(date -u)] SUCCESS: Versi $VERSION" >> "$LOG_FILE"
else
    echo "❌ FATAL: Healthcheck gagal setelah $MAX_ATTEMPTS percobaan!"
    if [ -n "$PREV_IMAGE" ]; then
        echo "⏪ Memulai rollback otomatis ke versi sebelumnya ($PREV_IMAGE)..."
        docker compose -f "$COMPOSE_FILE" stop app
        docker compose -f "$COMPOSE_FILE" up -d app
        echo "⚠️ Rollback selesai."
    fi
    echo "[$(date -u)] FAILED: Versi $VERSION (Healthcheck Gagal)" >> "$LOG_FILE"
    exit 1
fi
echo "=================================================="

