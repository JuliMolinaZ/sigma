#!/bin/bash

# Script para encontrar backups de base de datos

set -e

echo "🔍 Buscando backups de base de datos..."
echo ""

# Buscar archivos que empiecen con sigma_backup_* o sigma_production_export_*
# En las carpetas backups/ y docs/
BACKUPS=$(ls -t backups/sigma_backup_*.sql.gz backups/sigma_production_export_*.sql.gz \
             backups/sigma_backup_*.sql backups/sigma_production_export_*.sql \
             docs/sigma_backup_*.sql.gz docs/sigma_production_export_*.sql.gz \
             docs/sigma_backup_*.sql docs/sigma_production_export_*.sql 2>/dev/null | head -10)

if [ -z "$BACKUPS" ]; then
    echo "❌ No se encontraron backups"
    echo ""
    echo "   Buscando archivos que empiecen con:"
    echo "   - sigma_backup_*.sql"
    echo "   - sigma_backup_*.sql.gz"
    echo "   - sigma_production_export_*.sql"
    echo "   - sigma_production_export_*.sql.gz"
    echo ""
    echo "   En las carpetas: backups/ y docs/"
    echo ""
    echo "📋 Para crear un backup, ejecuta:"
    echo "   ./scripts/export-local-db.sh"
    exit 1
fi

echo "✅ Backups encontrados:"
echo ""
echo "$BACKUPS" | nl -w2 -s'. '

echo ""
echo "📤 Para subir el más reciente al servidor:"
LATEST=$(echo "$BACKUPS" | head -1)
echo ""
echo "   Opción 1: Automático (busca el más reciente)"
echo "   ./scripts/upload-backup.sh"
echo ""
echo "   Opción 2: Especificar archivo"
echo "   ./scripts/upload-backup.sh $LATEST"
echo ""

