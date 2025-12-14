#!/bin/bash

# Script para restaurar SOLO payment_complements del backup
# Extrae correctamente solo los datos de esta tabla

set -e

BACKUP_FILE="${1:-backups/sigma_backup_20251201_135929.sql.gz}"

echo "📦 Restaurando payment_complements desde backup..."
echo "   Backup: $BACKUP_FILE"
echo ""

# Extraer SOLO payment_complements usando un método más preciso
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | \
    awk '
        /^COPY public\.payment_complements \(/ {
            # Capturar la línea COPY
            print
            # Capturar datos hasta encontrar la línea que termina con \.
            while ((getline line) > 0) {
                print line
                if (line == "\\.") break
            }
            exit
        }
    ' | docker exec -i sigma-postgres psql -U sigma -d sigma_db 2>&1 | \
        grep -E "(COPY|ERROR)" || echo "✅ Completado"
else
    awk '
        /^COPY public\.payment_complements \(/ {
            print
            while ((getline line) > 0) {
                print line
                if (line == "\\.") break
            }
            exit
        }
    ' "$BACKUP_FILE" | docker exec -i sigma-postgres psql -U sigma -d sigma_db 2>&1 | \
        grep -E "(COPY|ERROR)" || echo "✅ Completado"
fi

echo ""
echo "✅ Payment complements restaurados"
