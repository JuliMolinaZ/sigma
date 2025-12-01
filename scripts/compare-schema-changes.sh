#!/bin/bash

# ===========================================
# Script para comparar cambios en el schema de Prisma
# ===========================================
# Este script compara el schema actual con los backups

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
API_DIR="${PROJECT_ROOT}/apps/api"
SCHEMA_FILE="${API_DIR}/prisma/schema.prisma"

echo "📊 Comparando cambios en Schema de Prisma"
echo "=========================================="
echo ""

cd "${API_DIR}"

if [ ! -f "${SCHEMA_FILE}" ]; then
    echo "❌ Error: No se encontró el archivo schema.prisma"
    exit 1
fi

# Buscar backups
BACKUPS=$(ls -t prisma/schema.prisma.backup.* 2>/dev/null | head -5)

if [ -z "$BACKUPS" ]; then
    echo "ℹ️  No se encontraron backups del schema"
    echo "   Los backups se crean automáticamente al sincronizar"
    exit 0
fi

echo "📁 Backups encontrados:"
for backup in $BACKUPS; do
    echo "   - $(basename $backup)"
done
echo ""

# Comparar con el backup más reciente
LATEST_BACKUP=$(echo "$BACKUPS" | head -1)
echo "🔄 Comparando con: $(basename $LATEST_BACKUP)"
echo ""

if command -v diff &> /dev/null; then
    diff -u "${LATEST_BACKUP}" "${SCHEMA_FILE}" || {
        echo ""
        echo "✅ Se encontraron diferencias (mostradas arriba)"
        echo ""
        echo "Para ver un resumen más detallado:"
        echo "   diff -u ${LATEST_BACKUP} ${SCHEMA_FILE} | less"
    }
else
    echo "⚠️  El comando 'diff' no está disponible"
    echo "   Instala diffutils para ver las diferencias"
fi

