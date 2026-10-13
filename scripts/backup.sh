#!/bin/sh
set -e

# ==========================================
# Script Backup Database: Couple Ledger
# ==========================================

BACKUP_DIR="${BACKUP_DIR:-/backups}"
POSTGRES_HOST="${POSTGRES_HOST:-db}"
POSTGRES_USER="${POSTGRES_USER:-ledger_prod}"
POSTGRES_DB="${POSTGRES_DB:-couple_ledger_prod}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"

perform_backup() {
    TIMESTAMP=$(date -u +"%Y%m%d_%H%M%SZ")
    BACKUP_FILE="$BACKUP_DIR/ledger_backup_${TIMESTAMP}.sql.gz"
    
    echo "=================================================="
    echo "📦 [$(date -u)] Memulai backup database: $POSTGRES_DB"
    echo "Target: $BACKUP_FILE"
    
    # Eksekusi pg_dump terkompresi gzip
    PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h "$POSTGRES_HOST" -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_FILE"
    
    # Verifikasi integritas file backup
    if [ ! -s "$BACKUP_FILE" ]; then
        echo "❌ ERROR: File backup kosong!"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
    
    if gzip -t "$BACKUP_FILE"; then
        FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
        echo "✅ Backup berhasil dan valid! Ukuran: $FILE_SIZE"
        echo "[$TIMESTAMP] SUCCESS: $BACKUP_FILE ($FILE_SIZE)" >> "$BACKUP_DIR/backup.log"
    else
        echo "❌ ERROR: File backup rusak (gagal uji gzip -t)!"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
    
    # Rotasi file backup lama (retensi harian)
    echo "🧹 Membersihkan backup yang lebih tua dari $RETENTION_DAYS hari..."
    find "$BACKUP_DIR" -name "ledger_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -exec rm -f {} \;
    echo "✅ Pembersihan retensi selesai."
    echo "=================================================="
}

if [ "$1" = "--once" ]; then
    perform_backup
    exit 0
fi

# Mode loop daemon harian (dijalankan oleh container backup)
echo "🚀 Container backup berjalan dalam mode terjadwal (setiap 24 jam)..."
while true; do
    perform_backup || echo "⚠️ Gagal backup terjadwal pada $(date -u)"
    echo "⏳ Menunggu 24 jam untuk siklus backup berikutnya..."
    sleep 86400
done

