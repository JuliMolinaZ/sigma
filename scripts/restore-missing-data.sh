#!/bin/bash

# Script para restaurar datos faltantes desde el backup
# Específicamente payment_complements y cualquier otra tabla que falte

set -e

BACKUP_FILE="${1:-backups/sigma_backup_20251201_135929.sql.gz}"

echo "📦 Restaurando datos faltantes desde backup"
echo "   Backup: $BACKUP_FILE"
echo ""

# Extraer solo payment_complements del backup
echo "1️⃣ Extrayendo payment_complements del backup..."

if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | awk '/^COPY public\.payment_complements/,/^\\\\.$/' | \
        docker exec -i sigma-postgres psql -U sigma -d sigma_db 2>&1 | grep -v "already exists" || true
else
    awk '/^COPY public\.payment_complements/,/^\\\\.$/' "$BACKUP_FILE" | \
        docker exec -i sigma-postgres psql -U sigma -d sigma_db 2>&1 | grep -v "already exists" || true
fi

echo ""
echo "✅ Payment complements restaurados"
