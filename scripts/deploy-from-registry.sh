#!/bin/bash

# Script para desplegar desde Docker Registry
# Uso: ./scripts/deploy-from-registry.sh [registry] [version]
# Ejemplo: ./scripts/deploy-from-registry.sh docker.io/tu-usuario v3.0.3

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración
REGISTRY=${1:-"docker.io/tu-usuario"}
VERSION=${2:-"latest"}

echo "🚀 SIGMA ERP - Despliegue desde Docker Registry"
echo "================================================"
echo "Registry: ${REGISTRY}"
echo "Versión: ${VERSION}"
echo ""

# Verificar que Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker no está corriendo${NC}"
    exit 1
fi

# Verificar que docker-compose.prod.yml existe
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.prod.yml no encontrado${NC}"
    exit 1
fi

# Verificar que .env existe
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Advertencia: .env no encontrado${NC}"
    echo "   Creando desde env.example..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo -e "${YELLOW}⚠️  IMPORTANTE: Edita .env y configura las variables necesarias${NC}"
        echo "   Ejecuta: nano .env"
        exit 1
    else
        echo -e "${RED}❌ Error: env.example no encontrado${NC}"
        exit 1
    fi
fi

# Paso 1: Pull de imágenes
echo -e "${BLUE}📥 Paso 1/4: Descargando imágenes del registry...${NC}"
docker pull ${REGISTRY}/sigma-api:${VERSION}
docker pull ${REGISTRY}/sigma-web:${VERSION}

echo -e "${GREEN}✅ Imágenes descargadas${NC}"

# Paso 2: Tag local para docker-compose
echo ""
echo -e "${BLUE}🏷️  Paso 2/4: Etiquetando imágenes localmente...${NC}"
docker tag ${REGISTRY}/sigma-api:${VERSION} sigma-api:latest
docker tag ${REGISTRY}/sigma-web:${VERSION} sigma-web:latest

echo -e "${GREEN}✅ Imágenes etiquetadas${NC}"

# Paso 3: Detener servicios actuales (si existen)
echo ""
echo -e "${BLUE}🛑 Paso 3/4: Deteniendo servicios actuales...${NC}"
docker-compose -f docker-compose.prod.yml down || true

# Paso 4: Levantar servicios
echo ""
echo -e "${BLUE}🚀 Paso 4/4: Levantando servicios...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Esperar a que los servicios estén saludables
echo ""
echo -e "${BLUE}⏳ Esperando a que los servicios estén listos...${NC}"
sleep 5

# Verificar estado
echo ""
echo -e "${BLUE}📊 Estado de los servicios:${NC}"
docker-compose -f docker-compose.prod.yml ps

# Verificar health checks
echo ""
echo -e "${BLUE}🏥 Verificando health checks...${NC}"

# API Health Check
if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API está respondiendo${NC}"
else
    echo -e "${YELLOW}⚠️  API no está respondiendo aún (puede tardar unos segundos)${NC}"
fi

# Web Health Check
if curl -f -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Web está respondiendo${NC}"
else
    echo -e "${YELLOW}⚠️  Web no está respondiendo aún (puede tardar unos segundos)${NC}"
fi

# Paso 5: Ejecutar migraciones
echo ""
read -p "¿Ejecutar migraciones de Prisma? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🔄 Ejecutando migraciones...${NC}"
    docker-compose -f docker-compose.prod.yml exec -T api sh -c "cd /app && npx prisma migrate deploy --schema=./prisma/schema.prisma" || {
        echo -e "${YELLOW}⚠️  No se pudo ejecutar migraciones automáticamente${NC}"
        echo "   Ejecuta manualmente:"
        echo "   docker-compose -f docker-compose.prod.yml exec api sh -c 'cd /app && npx prisma migrate deploy --schema=./prisma/schema.prisma'"
    }
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Despliegue completado!${NC}"
echo ""
echo -e "${BLUE}🌐 URLs:${NC}"
echo "   - API:  http://localhost:3000/api"
echo "   - Web:  http://localhost:3001"
echo "   - Docs: http://localhost:3000/api/docs"
echo ""
echo -e "${BLUE}📋 Comandos útiles:${NC}"
echo "   - Ver logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   - Ver estado: docker-compose -f docker-compose.prod.yml ps"
echo "   - Detener: docker-compose -f docker-compose.prod.yml down"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
