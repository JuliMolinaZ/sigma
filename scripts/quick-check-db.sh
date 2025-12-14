#!/bin/bash

# Script rápido para verificar problemas con la base de datos
# Uso: ./scripts/quick-check-db.sh [docker-compose-file]

COMPOSE_FILE=${1:-docker-compose.prod.images.yml}

echo "🔍 Verificación rápida de base de datos..."
echo ""

# Verificar si PostgreSQL está corriendo
echo "1. Estado del contenedor PostgreSQL:"
docker ps --filter "name=sigma-postgres" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "2. Healthcheck de PostgreSQL:"
docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U ${DB_USER:-sigma} 2>&1 || echo "❌ PostgreSQL no responde"

echo ""
echo "3. Conexión desde el contenedor API a la base de datos:"
docker compose -f "$COMPOSE_FILE" exec -T api curl -s http://localhost:3000/api/health/ready 2>/dev/null || echo "❌ No se pudo verificar"

echo ""
echo "4. Variable DATABASE_URL en el contenedor API:"
docker compose -f "$COMPOSE_FILE" exec -T api sh -c 'echo $DATABASE_URL' 2>/dev/null | sed 's/:[^:]*@/:****@/g' || echo "❌ No se pudo obtener"

echo ""
echo "5. Últimos errores relacionados con base de datos:"
docker compose -f "$COMPOSE_FILE" logs --tail=50 api 2>&1 | grep -i "database\|connection\|error\|postgres" | tail -10 || echo "No se encontraron errores recientes"

echo ""
echo "6. Logs recientes de PostgreSQL:"
docker compose -f "$COMPOSE_FILE" logs --tail=20 postgres 2>&1 | tail -10

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Si hay problemas, ejecuta:"
echo "   ./scripts/validate-docker-app.sh $COMPOSE_FILE"
echo ""
