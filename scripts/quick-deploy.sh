#!/bin/bash

# Script de despliegue rápido a producción

set -e

echo "🚀 SIGMA ERP - Despliegue Rápido"
echo "================================"
echo ""

# Verificar que existe el archivo .env
if [ ! -f ".env" ]; then
    echo "❌ Error: No se encontró el archivo .env"
    echo "   Copia env.example a .env y configura las variables:"
    echo "   cp env.example .env"
    echo "   nano .env"
    exit 1
fi

# Verificar que las variables críticas estén configuradas
source .env

if [ -z "$DATABASE_URL" ] || [ -z "$JWT_SECRET" ] || [ -z "$JWT_REFRESH_SECRET" ]; then
    echo "❌ Error: Variables críticas no configuradas en .env"
    echo "   Asegúrate de tener:"
    echo "   - DATABASE_URL"
    echo "   - JWT_SECRET"
    echo "   - JWT_REFRESH_SECRET"
    exit 1
fi

echo "📦 Construyendo imágenes..."
docker-compose -f docker-compose.prod.yml build

echo ""
echo "🚀 Levantando servicios..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Esperando que los servicios estén listos..."
sleep 10

echo ""
echo "🔄 Verificando estado de los servicios..."
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "📋 Verificando conectividad..."
echo "  - PostgreSQL:"
docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U sigma || echo "    ⚠️  PostgreSQL no está listo aún"

echo ""
echo "  - API Health:"
sleep 5
API_HEALTH=$(docker-compose -f docker-compose.prod.yml exec -T api sh -c "node -e \"require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\" 2>/dev/null && echo 'OK' || echo 'FAIL'") || echo "FAIL"
if [ "$API_HEALTH" = "OK" ]; then
    echo "    ✅ API está respondiendo"
else
    echo "    ⚠️  API aún no está lista (puede tardar unos segundos más)"
fi

echo ""
echo "✅ Despliegue completado!"
echo ""
echo "📊 Comandos útiles:"
echo "  - Ver logs:         docker-compose -f docker-compose.prod.yml logs -f"
echo "  - Ver estado:       docker-compose -f docker-compose.prod.yml ps"
echo "  - Detener:          docker-compose -f docker-compose.prod.yml down"
echo "  - Restart:          docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "🔗 URLs:"
echo "  - API:  http://localhost:${API_PORT:-3000}/api"
echo "  - Web:  http://localhost:${WEB_PORT:-3001}"
echo "  - Docs: http://localhost:${API_PORT:-3000}/api/docs"
echo ""
echo "⚠️  Si es la primera vez, asegúrate de:"
echo "   1. Restaurar la base de datos: ./scripts/restore-database.sh backups/archivo.sql.gz"
echo "   2. Ejecutar migraciones: make migrate"
echo ""

