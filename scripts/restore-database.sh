#!/bin/bash

# Script para restaurar backup en producción

set -e

if [ -z "$1" ]; then
    echo "❌ Uso: $0 <archivo_backup.sql[.gz]>"
    echo "   Ejemplo: $0 backups/sigma_backup_20241201_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Variables de configuración (se pueden pasar como variables de entorno)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-sigma}
DB_NAME=${DB_NAME:-sigma_db}

echo "🗄️  Restaurando base de datos desde: $BACKUP_FILE"

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: El archivo $BACKUP_FILE no existe"
    exit 1
fi

# Solicitar confirmación
echo "⚠️  ADVERTENCIA: Esta operación SOBRESCRIBIRÁ la base de datos actual"
echo "   Base de datos: $DB_NAME"
echo "   Host: $DB_HOST:$DB_PORT"
read -p "¿Estás seguro de continuar? (escribe 'si' para confirmar): " CONFIRM

if [ "$CONFIRM" != "si" ]; then
    echo "❌ Operación cancelada"
    exit 1
fi

# Solicitar contraseña si no está en variable de entorno
if [ -z "$DB_PASSWORD" ]; then
    echo "Por favor ingresa la contraseña de la base de datos:"
    read -s DB_PASSWORD
fi

# Descomprimir si es .gz
TEMP_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "📦 Descomprimiendo backup..."
    TEMP_FILE="/tmp/sigma_restore_$(date +%s).sql"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    CLEANUP_TEMP=true
else
    CLEANUP_TEMP=false
fi

# Restaurar backup
echo "🔄 Restaurando backup..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$TEMP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Base de datos restaurada exitosamente"
    
    # Ejecutar migraciones de Prisma si es necesario
    echo "🔄 Ejecutando migraciones de Prisma..."
    cd apps/api
    npx prisma migrate deploy
    cd ../..
    
    echo "✅ Proceso completado"
else
    echo "❌ Error al restaurar backup"
    exit 1
fi

# Limpiar archivo temporal si fue creado
if [ "$CLEANUP_TEMP" = true ]; then
    rm -f "$TEMP_FILE"
fi

