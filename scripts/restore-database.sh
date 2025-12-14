#!/bin/bash

# Script para restaurar backup en producción
# Funciona tanto con Docker Compose como con PostgreSQL directo

set -e

if [ -z "$1" ]; then
    echo "❌ Uso: $0 <archivo_backup.sql[.gz]>"
    echo "   Ejemplo: $0 backups/sigma_backup_20241201_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Detectar si estamos usando Docker Compose
USE_DOCKER=false
if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
    if docker ps | grep -q sigma-postgres || docker ps | grep -q postgres; then
        USE_DOCKER=true
        COMPOSE_FILE="docker-compose.prod.images.yml"
        if [ ! -f "$COMPOSE_FILE" ]; then
            COMPOSE_FILE="docker-compose.prod.yml"
        fi
        if [ ! -f "$COMPOSE_FILE" ]; then
            COMPOSE_FILE="docker-compose.yml"
        fi
    fi
fi

# Variables de configuración
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
if [ "$USE_DOCKER" = true ]; then
    echo "   Método: Docker Compose"
else
    echo "   Host: $DB_HOST:$DB_PORT"
fi
read -p "¿Estás seguro de continuar? (escribe 'si' para confirmar): " CONFIRM

if [ "$CONFIRM" != "si" ]; then
    echo "❌ Operación cancelada"
    exit 1
fi

# Restaurar backup
if [ "$USE_DOCKER" = true ]; then
    echo "🐳 Restaurando usando Docker Compose..."
    
    # Si el archivo está en backups/ relativo, usar /backups/ en el contenedor
    BACKUP_PATH="$BACKUP_FILE"
    if [[ "$BACKUP_FILE" == backups/* ]]; then
        BACKUP_PATH="/backups/$(basename "$BACKUP_FILE")"
    fi
    
    # Copiar archivo al contenedor si no está en el volumen montado
    if [[ "$BACKUP_FILE" != backups/* ]]; then
        echo "📦 Copiando archivo al contenedor..."
        docker cp "$BACKUP_FILE" sigma-postgres:/tmp/restore.sql
        BACKUP_PATH="/tmp/restore.sql"
        CLEANUP_DOCKER_TEMP=true
    else
        CLEANUP_DOCKER_TEMP=false
    fi
    
    # Restaurar desde el contenedor
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        echo "📦 Descomprimiendo y restaurando..."
        docker exec -i sigma-postgres sh -c "gunzip -c $BACKUP_PATH | psql -U $DB_USER -d $DB_NAME" || \
        docker exec -i sigma-postgres sh -c "cat $BACKUP_PATH | gunzip | psql -U $DB_USER -d $DB_NAME"
    else
        echo "🔄 Restaurando..."
        docker exec -i sigma-postgres sh -c "psql -U $DB_USER -d $DB_NAME < $BACKUP_PATH"
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ Base de datos restaurada exitosamente"
        
        # Limpiar archivo temporal del contenedor
        if [ "$CLEANUP_DOCKER_TEMP" = true ]; then
            docker exec sigma-postgres rm -f /tmp/restore.sql
        fi
        
        # Ejecutar migraciones de Prisma si es necesario
        echo "🔄 Ejecutando migraciones de Prisma..."
        docker-compose -f "$COMPOSE_FILE" exec -T api sh -c "cd /app && npx -y prisma@5.19.1 migrate deploy --schema=./prisma/schema.prisma" || \
        docker exec sigma-api sh -c "cd /app && npx -y prisma@5.19.1 migrate deploy --schema=./prisma/schema.prisma" || \
        echo "⚠️  No se pudo ejecutar migraciones de Prisma (puede que no sean necesarias)"
        
        echo "✅ Proceso completado"
    else
        echo "❌ Error al restaurar backup"
        exit 1
    fi
else
    # Método tradicional con psql directo
    echo "🔄 Restaurando usando psql directo..."
    
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
fi

