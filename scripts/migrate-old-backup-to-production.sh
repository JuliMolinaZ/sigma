#!/bin/bash

# Script para migrar datos de un backup antiguo (esquema diferente) a producción
# 
# Este script:
# 1. Restaura el backup antiguo a una base de datos temporal
# 2. Extrae los datos usando Prisma Client
# 3. Transforma los datos al esquema nuevo
# 4. Inserta los datos en producción

set -e

if [ -z "$1" ]; then
    echo "❌ Uso: $0 <archivo_backup.sql[.gz]>"
    echo "   Ejemplo: $0 backups/sigma_backup_20241201_120000.sql.gz"
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "   - Este script restaurará el backup a una base de datos TEMPORAL (sigma_db_old)"
    echo "   - Los datos se migrarán al esquema nuevo y se insertarán en producción"
    echo "   - Asegúrate de tener un backup de producción ANTES de ejecutar esto"
    exit 1
fi

BACKUP_FILE="$1"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OLD_DB_NAME="sigma_db_old_${TIMESTAMP}"
TEMP_DIR="/tmp/sigma_migration_${TIMESTAMP}"

echo "🗄️  Migrando datos de backup antiguo a producción"
echo "   Backup: $BACKUP_FILE"
echo "   Base de datos temporal: $OLD_DB_NAME"
echo ""

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: El archivo $BACKUP_FILE no existe"
    exit 1
fi

# Solicitar confirmación
echo "⚠️  ADVERTENCIA: Este proceso:"
echo "   1. Creará una base de datos temporal: $OLD_DB_NAME"
echo "   2. Restaurará el backup antiguo ahí"
echo "   3. Migrará los datos al esquema nuevo"
echo "   4. Insertará los datos en producción (sigma_db)"
echo ""
read -p "¿Tienes un backup de producción actual? (si/no): " HAS_BACKUP

if [ "$HAS_BACKUP" != "si" ]; then
    echo ""
    echo "⚠️  Te recomendamos crear un backup primero:"
    echo "   ./scripts/backup-database.sh"
    echo ""
    read -p "¿Continuar de todos modos? (escribe 'si' para confirmar): " CONFIRM
    if [ "$CONFIRM" != "si" ]; then
        echo "❌ Operación cancelada"
        exit 1
    fi
fi

# Detectar si estamos usando Docker
USE_DOCKER=false
if command -v docker &> /dev/null && docker ps | grep -q sigma-postgres; then
    USE_DOCKER=true
    echo "🐳 Usando Docker para la migración..."
fi

if [ "$USE_DOCKER" = true ]; then
    # Usar Docker
    echo "📦 Paso 1: Creando base de datos temporal..."
    docker exec sigma-postgres psql -U sigma -d postgres -c "CREATE DATABASE ${OLD_DB_NAME};"
    
    echo "📦 Paso 2: Restaurando backup antiguo..."
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        gunzip -c "$BACKUP_FILE" | docker exec -i sigma-postgres psql -U sigma -d "${OLD_DB_NAME}"
    else
        cat "$BACKUP_FILE" | docker exec -i sigma-postgres psql -U sigma -d "${OLD_DB_NAME}"
    fi
    
    echo "✅ Backup restaurado en base de datos temporal"
    echo ""
    echo "📋 Próximos pasos:"
    echo "   1. Ejecuta el script de migración TypeScript:"
    echo "      cd apps/api"
    echo "      DATABASE_URL_TEMP='postgresql://sigma:\${DB_PASSWORD}@localhost:5432/${OLD_DB_NAME}' npm run migrate:old-backup"
    echo ""
    echo "   2. Una vez completada la migración, limpia la base temporal:"
    echo "      docker exec sigma-postgres psql -U sigma -d postgres -c 'DROP DATABASE ${OLD_DB_NAME};'"
else
    echo "❌ Docker no está disponible o PostgreSQL no está corriendo"
    echo "   Por favor, ejecuta este script donde Docker esté disponible"
    exit 1
fi
