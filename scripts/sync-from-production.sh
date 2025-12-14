#!/bin/bash

# ===========================================
# Script para sincronizar código y schema desde producción
# ===========================================
# Este script trae todos los cambios desde producción:
# 1. Sincroniza el código fuente desde el servidor
# 2. Sincroniza el schema de Prisma con la base de datos de producción
# 3. Regenera el cliente de Prisma

set -e

# Configuración
SERVER="${DEPLOY_SERVER:-root@example.com}"
REMOTE_DIR="/root/sigma"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 SIGMA ERP - Sincronización desde Producción${NC}"
echo "================================================"
echo "Servidor: ${SERVER}"
echo "Directorio remoto: ${REMOTE_DIR}"
echo "Directorio local: ${LOCAL_DIR}"
echo ""

# Verificar conexión SSH
echo -e "${BLUE}📡 Paso 1/4: Verificando conexión SSH...${NC}"
if ! ssh -o ConnectTimeout=5 ${SERVER} "echo 'Conexión OK'" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: No se puede conectar al servidor ${SERVER}${NC}"
    echo "   Verifica que tengas acceso SSH configurado"
    exit 1
fi
echo -e "${GREEN}✅ Conexión SSH establecida${NC}\n"

# Paso 1: Sincronizar código fuente
echo -e "${BLUE}📥 Paso 2/4: Sincronizando código fuente desde producción...${NC}"
echo "   Esto puede tardar unos minutos..."

# Directorios a sincronizar (excluyendo node_modules, dist, .git, etc.)
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '.git' \
    --exclude '.next' \
    --exclude '.env' \
    --exclude '*.log' \
    --exclude 'backups' \
    --exclude 'prisma/dev.db' \
    --exclude 'prisma/migrations' \
    ${SERVER}:${REMOTE_DIR}/ ${LOCAL_DIR}/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Código sincronizado exitosamente${NC}\n"
else
    echo -e "${RED}❌ Error al sincronizar código${NC}"
    exit 1
fi

# Paso 2: Sincronizar schema de Prisma desde la base de datos de producción
echo -e "${BLUE}🗄️  Paso 3/4: Sincronizando schema de Prisma desde base de datos de producción...${NC}"
cd "${LOCAL_DIR}/apps/api"

# Hacer backup del schema actual
if [ -f "prisma/schema.prisma" ]; then
    BACKUP_SCHEMA="prisma/schema.prisma.backup.$(date +%Y%m%d_%H%M%S)"
    cp "prisma/schema.prisma" "${BACKUP_SCHEMA}"
    echo "   Backup del schema guardado en: ${BACKUP_SCHEMA}"
fi

# Sincronizar schema desde producción
echo "   Extrayendo schema desde base de datos de producción..."
npx prisma db pull

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema de Prisma sincronizado${NC}\n"
else
    echo -e "${RED}❌ Error al sincronizar schema${NC}"
    echo "   Restaurando backup del schema..."
    if [ -f "${BACKUP_SCHEMA}" ]; then
        cp "${BACKUP_SCHEMA}" "prisma/schema.prisma"
    fi
    exit 1
fi

# Paso 3: Regenerar cliente de Prisma
echo -e "${BLUE}🔧 Paso 4/4: Regenerando cliente de Prisma...${NC}"
npx prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cliente de Prisma regenerado${NC}\n"
else
    echo -e "${RED}❌ Error al regenerar cliente de Prisma${NC}"
    exit 1
fi

# Resumen
echo -e "${GREEN}✅ Sincronización completada exitosamente${NC}"
echo ""
echo "📋 Resumen:"
echo "   ✓ Código fuente sincronizado desde producción"
echo "   ✓ Schema de Prisma sincronizado desde base de datos"
echo "   ✓ Cliente de Prisma regenerado"
echo ""
echo -e "${YELLOW}⚠️  NOTA: Revisa los cambios en el schema antes de hacer commit${NC}"
echo "   Archivo: apps/api/prisma/schema.prisma"
echo ""
echo "Para verificar la conexión:"
echo "   cd apps/api && ts-node scripts/verify-production-connection.ts"

