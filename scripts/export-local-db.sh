#!/bin/bash

# Script para exportar la base de datos local y prepararla para producción

set -e

echo "📤 Exportando base de datos local para producción..."

# Variables de configuración local (ajusta según tu entorno)
LOCAL_DB_HOST=${LOCAL_DB_HOST:-localhost}
LOCAL_DB_PORT=${LOCAL_DB_PORT:-5432}
LOCAL_DB_USER=${LOCAL_DB_USER:-sigma}
LOCAL_DB_NAME=${LOCAL_DB_NAME:-sigma_db}
BACKUP_DIR=${BACKUP_DIR:-./backups}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/sigma_production_export_${TIMESTAMP}.sql"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Solicitar contraseña local si no está en variable de entorno
if [ -z "$LOCAL_DB_PASSWORD" ]; then
    echo "Por favor ingresa la contraseña de tu base de datos local:"
    read -s LOCAL_DB_PASSWORD
fi

echo "📦 Creando dump de la base de datos local..."
PGPASSWORD="$LOCAL_DB_PASSWORD" pg_dump \
    -h "$LOCAL_DB_HOST" \
    -p "$LOCAL_DB_PORT" \
    -U "$LOCAL_DB_USER" \
    -d "$LOCAL_DB_NAME" \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    -F p > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Dump creado exitosamente: $BACKUP_FILE"
    
    # Comprimir
    echo "📦 Comprimiendo..."
    gzip "$BACKUP_FILE"
    COMPRESSED_FILE="${BACKUP_FILE}.gz"
    
    echo ""
    echo "✅ Exportación completada!"
    echo ""
    echo "📋 Próximos pasos para producción:"
    echo ""
    echo "1. Sube el archivo a tu servidor:"
    echo "   scp $COMPRESSED_FILE usuario@servidor:/ruta/destino/"
    echo ""
    echo "2. En el servidor, restaura la base de datos:"
    echo "   ./scripts/restore-database.sh $COMPRESSED_FILE"
    echo ""
    echo "3. O si usas Docker, copia el archivo a ./backups/ y ejecuta:"
    echo "   docker-compose -f docker-compose.prod.yml exec postgres sh -c 'gunzip -c /backups/$(basename $COMPRESSED_FILE) | psql -U \${POSTGRES_USER} -d \${POSTGRES_DB}'"
else
    echo "❌ Error al crear dump"
    exit 1
fi

