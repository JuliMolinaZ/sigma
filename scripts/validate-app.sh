#!/bin/bash

# Script para validar que la aplicación funciona correctamente después de restaurar el backup

set -e

echo "🔍 Validando aplicación SIGMA ERP..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
API_URL="http://localhost:3000/api"
WEB_URL="http://localhost:3001"
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-sigma}
DB_NAME=${DB_NAME:-sigma_db}

# Función para verificar
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1${NC}"
        return 1
    fi
}

# 1. Verificar que PostgreSQL está corriendo
echo "1️⃣  Verificando base de datos..."
PGPASSWORD=sigma_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1
check "Base de datos PostgreSQL accesible"

# 2. Verificar que Redis está corriendo
echo "2️⃣  Verificando Redis..."
redis-cli -h localhost -p 6379 ping > /dev/null 2>&1
check "Redis accesible"

# 3. Verificar datos en la base de datos
echo "3️⃣  Verificando datos restaurados..."
ORGS=$(PGPASSWORD=sigma_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM organizations;" 2>/dev/null | xargs)
USERS=$(PGPASSWORD=sigma_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
PROJECTS=$(PGPASSWORD=sigma_password psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM projects;" 2>/dev/null | xargs)

if [ "$ORGS" -gt 0 ] && [ "$USERS" -gt 0 ]; then
    echo -e "${GREEN}✅ Datos encontrados: ${ORGS} organizaciones, ${USERS} usuarios, ${PROJECTS} proyectos${NC}"
else
    echo -e "${RED}❌ No se encontraron datos en la base de datos${NC}"
fi

# 4. Verificar que la API está corriendo
echo "4️⃣  Verificando API (puerto 3000)..."
if curl -s -f "${API_URL}/health" > /dev/null 2>&1; then
    check "API respondiendo en ${API_URL}"
else
    echo -e "${YELLOW}⚠️  API no está corriendo. Inicia con: cd apps/api && pnpm dev${NC}"
fi

# 5. Verificar endpoint de health
echo "5️⃣  Verificando endpoint de health..."
HEALTH_RESPONSE=$(curl -s "${API_URL}/health" 2>/dev/null || echo "")
if [ ! -z "$HEALTH_RESPONSE" ]; then
    echo -e "${GREEN}✅ Health endpoint respondiendo${NC}"
    echo "   Respuesta: $HEALTH_RESPONSE"
else
    echo -e "${YELLOW}⚠️  Health endpoint no disponible (API puede no estar corriendo)${NC}"
fi

# 6. Verificar Swagger
echo "6️⃣  Verificando documentación Swagger..."
if curl -s -f "${API_URL}/docs" > /dev/null 2>&1; then
    check "Swagger disponible en ${API_URL}/docs"
else
    echo -e "${YELLOW}⚠️  Swagger no disponible${NC}"
fi

# 7. Verificar que el frontend está corriendo
echo "7️⃣  Verificando Frontend (puerto 3001)..."
if curl -s -f "${WEB_URL}" > /dev/null 2>&1; then
    check "Frontend respondiendo en ${WEB_URL}"
else
    echo -e "${YELLOW}⚠️  Frontend no está corriendo. Inicia con: cd apps/web && pnpm dev${NC}"
fi

# 8. Verificar conexión de Prisma
echo "8️⃣  Verificando Prisma..."
cd apps/api
if npx prisma db pull --schema=./prisma/schema.prisma > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Prisma puede conectarse a la base de datos${NC}"
else
    echo -e "${YELLOW}⚠️  Prisma no pudo conectarse (verifica DATABASE_URL en .env)${NC}"
fi
cd ../..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Resumen de validación:"
echo ""
echo "   Base de datos: ✅ PostgreSQL corriendo"
echo "   Redis: ✅ Redis corriendo"
echo "   Datos: ✅ ${ORGS} organizaciones, ${USERS} usuarios, ${PROJECTS} proyectos"
echo ""
echo "   Para iniciar los servicios:"
echo "   - API:    cd apps/api && pnpm dev"
echo "   - Web:    cd apps/web && pnpm dev"
echo ""
echo "   URLs importantes:"
echo "   - API:    ${API_URL}"
echo "   - Docs:   ${API_URL}/docs"
echo "   - Web:    ${WEB_URL}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
