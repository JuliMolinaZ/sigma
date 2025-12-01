#!/bin/bash

# Script para subir backup de base de datos al servidor

set -e

SERVER="root@64.23.225.99"
REMOTE_DIR="/root/sigma/backups"

# Si no se especifica archivo, buscar el más reciente (sigma_backup_* o sigma_production_export_*)
if [ -z "$1" ]; then
    echo "🔍 Buscando backup más reciente..."
    
    # Buscar en backups/ y docs/ con diferentes patrones
    BACKUP_FILE=$(ls -t backups/sigma_backup_*.sql.gz backups/sigma_production_export_*.sql.gz \
                     backups/sigma_backup_*.sql backups/sigma_production_export_*.sql \
                     docs/sigma_backup_*.sql.gz docs/sigma_production_export_*.sql.gz \
                     docs/sigma_backup_*.sql docs/sigma_production_export_*.sql 2>/dev/null | head -1)
    
    if [ -z "$BACKUP_FILE" ]; then
        echo "❌ No se encontró ningún backup"
        echo "   Buscando archivos que empiecen con:"
        echo "   - sigma_backup_*.sql"
        echo "   - sigma_backup_*.sql.gz"
        echo "   - sigma_production_export_*.sql"
        echo "   - sigma_production_export_*.sql.gz"
        echo ""
        echo "   En las carpetas: backups/ y docs/"
        echo ""
        echo "   Uso: $0 <archivo_backup>"
        echo "   Ejemplo: $0 docs/sigma_backup_20251201_095107.sql"
        exit 1
    fi
    
    echo "✅ Backup encontrado: $BACKUP_FILE"
else
    BACKUP_FILE="$1"
fi

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: El archivo $BACKUP_FILE no existe"
    exit 1
fi

echo "📤 Subiendo backup a ${SERVER}..."
echo "   Archivo: $BACKUP_FILE"
echo "   Destino: ${REMOTE_DIR}/"
echo ""

# Crear directorio remoto si no existe
ssh ${SERVER} "mkdir -p ${REMOTE_DIR}"

# Comprimir si es .sql (no comprimido)
if [[ "$BACKUP_FILE" == *.sql ]] && [[ "$BACKUP_FILE" != *.gz ]]; then
    echo "📦 Comprimiendo backup antes de subir..."
    gzip -c "$BACKUP_FILE" > "${BACKUP_FILE}.gz"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    TEMP_COMPRESSED=true
else
    TEMP_COMPRESSED=false
fi

# Subir archivo
scp "$BACKUP_FILE" ${SERVER}:${REMOTE_DIR}/

# Limpiar archivo temporal comprimido si se creó
if [ "$TEMP_COMPRESSED" = true ]; then
    rm -f "$BACKUP_FILE"
fi

echo "✅ Backup subido exitosamente!"
echo ""
echo "📋 Para restaurar en el servidor:"
echo "   ssh ${SERVER}"
echo "   cd /root/sigma"
BACKUP_NAME=$(basename "$BACKUP_FILE")
if [[ "$BACKUP_NAME" == *.gz ]]; then
    echo "   docker-compose -f docker-compose.prod.yml exec postgres sh -c \\"
    echo "     'gunzip -c /backups/$BACKUP_NAME | psql -U \${POSTGRES_USER} -d \${POSTGRES_DB}'"
else
    echo "   docker-compose -f docker-compose.prod.yml exec postgres sh -c \\"
    echo "     'psql -U \${POSTGRES_USER} -d \${POSTGRES_DB} < /backups/$BACKUP_NAME'"
fi
echo ""

