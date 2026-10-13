#!/bin/sh
set -e

# ==========================================
# Script Restore Database: Couple Ledger
# ==========================================

BACKUP_FILE="$1"
POSTGRES_HOST="${POSTGRES_HOST:-db}"
POSTGRES_USER="${POSTGRES_USER:-ledger_prod}"
POSTGRES_DB="${POSTGRES_DB:-couple_ledger_prod}"
TEST_DB="couple_ledger_restore_test"

if [ -z "$BACKUP_FILE" ]; then
    echo "Penggunaan: $0 <path_file_backup.sql.gz>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ ERROR: File backup tidak ditemukan: $BACKUP_FILE"
    exit 1
fi

echo "=================================================="
echo "🔍 1. Memeriksa integritas file backup..."
if ! gzip -t "$BACKUP_FILE"; then
    echo "❌ ERROR: File backup corrupt (gagal uji gzip -t)!"
    exit 1
fi
echo "✅ File backup valid."

echo "🧪 2. Menjalankan Uji Coba Restore ke Database Sementara ($TEST_DB)..."
# Buat database pengujian
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -c "DROP DATABASE IF EXISTS $TEST_DB;" postgres
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -c "CREATE DATABASE $TEST_DB;" postgres

# Restore ke database pengujian
gunzip -c "$BACKUP_FILE" | PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" "$TEST_DB" > /dev/null

# Verifikasi tabel di database uji coba
TABLE_COUNT=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" "$TEST_DB" | xargs)
echo "✅ Uji coba restore berhasil! Ditemukan $TABLE_COUNT tabel di schema public."

# Bersihkan database uji coba
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -c "DROP DATABASE $TEST_DB;" postgres

# Konfirmasi restore ke database utama
echo ""
echo "⚠️ PERINGATAN: Anda akan memulihkan data ke database UTAMA ($POSTGRES_DB)."
echo "Data saat ini di $POSTGRES_DB akan ditimpa oleh data dari file backup."
printf "Apakah Anda yakin ingin melanjutkan? (ketik 'RESTORE' untuk konfirmasi): "
read CONFIRMATION

if [ "$CONFIRMATION" != "RESTORE" ]; then
    echo "🚫 Pemulihan database dibatalkan oleh pengguna."
    exit 0
fi

echo "⚡ 3. Memulihkan ke Database Utama ($POSTGRES_DB)..."
gunzip -c "$BACKUP_FILE" | PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" "$POSTGRES_DB"
echo "🎉 Pemulihan database utama berhasil 100%!"
echo "=================================================="

