#!/bin/bash

# Script para validar que la aplicación funciona correctamente en Docker
# Uso: ./scripts/validate-docker-app.sh [docker-compose-file]

set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Determinar qué archivo docker-compose usar
COMPOSE_FILE=${1:-docker-compose.prod.images.yml}

if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}❌ Error: No se encontró el archivo $COMPOSE_FILE${NC}"
    echo "   Archivos disponibles:"
    ls -1 docker-compose*.yml 2>/dev/null || echo "   (ninguno encontrado)"
    exit 1
fi

echo -e "${BLUE}🔍 Validando aplicación SIGMA ERP en Docker${NC}"
echo -e "${BLUE}   Usando: $COMPOSE_FILE${NC}"
echo ""

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

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 1. Verificar que Docker está corriendo
echo "1️⃣  Verificando Docker..."
if docker ps > /dev/null 2>&1; then
    check "Docker está corriendo"
else
    echo -e "${RED}❌ Docker no está corriendo o no tienes permisos${NC}"
    exit 1
fi

# 2. Verificar que docker-compose está disponible
echo "2️⃣  Verificando docker-compose..."
if docker compose version > /dev/null 2>&1 || docker-compose version > /dev/null 2>&1; then
    check "docker-compose está disponible"
else
    echo -e "${RED}❌ docker-compose no está instalado${NC}"
    exit 1
fi

# 3. Verificar estado de los contenedores
echo ""
echo "3️⃣  Estado de los contenedores..."
docker compose -f "$COMPOSE_FILE" ps

# 4. Verificar que los contenedores están corriendo
echo ""
echo "4️⃣  Verificando que los contenedores están corriendo..."
CONTAINERS=("sigma-postgres" "sigma-redis" "sigma-api" "sigma-web")
ALL_RUNNING=true

for container in "${CONTAINERS[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        STATUS=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "not-found")
        if [ "$STATUS" = "running" ]; then
            echo -e "${GREEN}✅ $container está corriendo${NC}"
        else
            echo -e "${RED}❌ $container está en estado: $STATUS${NC}"
            ALL_RUNNING=false
        fi
    else
        echo -e "${RED}❌ $container no está corriendo${NC}"
        ALL_RUNNING=false
    fi
done

# 5. Verificar healthcheck de PostgreSQL
echo ""
echo "5️⃣  Verificando salud de PostgreSQL..."
if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U ${DB_USER:-sigma} > /dev/null 2>&1; then
    check "PostgreSQL está listo y saludable"
else
    echo -e "${RED}❌ PostgreSQL no está respondiendo correctamente${NC}"
    echo ""
    info "Últimos logs de PostgreSQL:"
    docker compose -f "$COMPOSE_FILE" logs --tail=20 postgres
fi

# 6. Verificar conexión a la base de datos desde el contenedor
echo ""
echo "6️⃣  Verificando conexión a la base de datos..."
DB_USER_ENV=${DB_USER:-sigma}
DB_NAME_ENV=${DB_NAME:-sigma_db}

# Obtener password del .env o del contenedor
DB_PASSWORD_ENV=${DB_PASSWORD:-}

if [ -z "$DB_PASSWORD_ENV" ] && [ -f ".env" ]; then
    source .env
    DB_PASSWORD_ENV=${DB_PASSWORD:-}
fi

if [ -n "$DB_PASSWORD_ENV" ]; then
    if docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$DB_USER_ENV" -d "$DB_NAME_ENV" -c "SELECT 1;" > /dev/null 2>&1; then
        check "Conexión a la base de datos exitosa"
    else
        echo -e "${RED}❌ No se pudo conectar a la base de datos${NC}"
        info "Verificando variables de entorno..."
        docker compose -f "$COMPOSE_FILE" config | grep -A 5 "postgres:" | head -10
    fi
else
    warn "No se pudo obtener DB_PASSWORD del .env, saltando verificación directa"
fi

# 7. Verificar datos en la base de datos
echo ""
echo "7️⃣  Verificando datos en la base de datos..."
if [ -n "$DB_PASSWORD_ENV" ]; then
    ORGS=$(docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$DB_USER_ENV" -d "$DB_NAME_ENV" -t -c "SELECT COUNT(*) FROM organizations;" 2>/dev/null | tr -d ' ' | xargs || echo "0")
    USERS=$(docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$DB_USER_ENV" -d "$DB_NAME_ENV" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' | xargs || echo "0")
    PROJECTS=$(docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$DB_USER_ENV" -d "$DB_NAME_ENV" -t -c "SELECT COUNT(*) FROM projects;" 2>/dev/null | tr -d ' ' | xargs || echo "0")
    
    if [ "$ORGS" != "0" ] || [ "$USERS" != "0" ]; then
        echo -e "${GREEN}✅ Datos encontrados: ${ORGS} organizaciones, ${USERS} usuarios, ${PROJECTS} proyectos${NC}"
    else
        warn "No se encontraron datos en la base de datos (puede estar vacía o recién inicializada)"
    fi
else
    warn "No se pudo verificar datos (falta DB_PASSWORD)"
fi

# 8. Verificar healthcheck de Redis
echo ""
echo "8️⃣  Verificando salud de Redis..."
if docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping > /dev/null 2>&1; then
    check "Redis está respondiendo"
else
    echo -e "${RED}❌ Redis no está respondiendo${NC}"
    info "Últimos logs de Redis:"
    docker compose -f "$COMPOSE_FILE" logs --tail=10 redis
fi

# 9. Verificar que la API puede conectarse a la base de datos
echo ""
echo "9️⃣  Verificando conexión API -> Base de datos..."
API_READY=$(docker compose -f "$COMPOSE_FILE" exec -T api curl -s http://localhost:3000/api/health/ready 2>/dev/null || echo "")
if echo "$API_READY" | grep -q '"database":"connected"'; then
    check "API puede conectarse a la base de datos"
elif echo "$API_READY" | grep -q '"database":"disconnected"'; then
    echo -e "${RED}❌ API NO puede conectarse a la base de datos${NC}"
    echo "   Respuesta: $API_READY"
    echo ""
    info "Verificando variable DATABASE_URL en el contenedor API:"
    docker compose -f "$COMPOSE_FILE" exec -T api sh -c 'echo $DATABASE_URL' | sed 's/:[^:]*@/:****@/g'
    echo ""
    info "Últimos logs de la API:"
    docker compose -f "$COMPOSE_FILE" logs --tail=30 api | grep -i "error\|database\|connection" || docker compose -f "$COMPOSE_FILE" logs --tail=20 api
else
    warn "No se pudo verificar el endpoint /health/ready"
    info "Intentando endpoint básico /health..."
    API_BASIC=$(docker compose -f "$COMPOSE_FILE" exec -T api curl -s http://localhost:3000/api/health 2>/dev/null || echo "")
    if [ -n "$API_BASIC" ]; then
        echo -e "${GREEN}✅ API está respondiendo${NC}"
        echo "   Respuesta: $API_BASIC"
    else
        echo -e "${RED}❌ API no está respondiendo${NC}"
        info "Últimos logs de la API:"
        docker compose -f "$COMPOSE_FILE" logs --tail=30 api
    fi
fi

# 10. Verificar endpoint de health de la API
echo ""
echo "🔟 Verificando endpoint de health de la API..."
API_HEALTH=$(docker compose -f "$COMPOSE_FILE" exec -T api curl -s http://localhost:3000/api/health 2>/dev/null || echo "")
if [ -n "$API_HEALTH" ]; then
    echo -e "${GREEN}✅ Health endpoint respondiendo${NC}"
    echo "   Respuesta: $API_HEALTH"
else
    warn "Health endpoint no disponible"
fi

# 11. Verificar logs de errores recientes
echo ""
echo "1️⃣1️⃣  Verificando errores recientes en los logs..."
ERRORS_FOUND=false

for service in postgres redis api web; do
    ERRORS=$(docker compose -f "$COMPOSE_FILE" logs --tail=50 "$service" 2>&1 | grep -i "error\|fatal\|failed\|exception" | head -5 || true)
    if [ -n "$ERRORS" ]; then
        echo -e "${YELLOW}⚠️  Errores en $service:${NC}"
        echo "$ERRORS" | sed 's/^/   /'
        ERRORS_FOUND=true
    fi
done

if [ "$ERRORS_FOUND" = false ]; then
    echo -e "${GREEN}✅ No se encontraron errores recientes${NC}"
fi

# 12. Verificar red Docker
echo ""
echo "1️⃣2️⃣  Verificando red Docker..."
if docker network ls | grep -q "sigma.*sigma-network\|.*sigma-network"; then
    NETWORK=$(docker network ls | grep "sigma.*sigma-network\|.*sigma-network" | awk '{print $1}' | head -1)
    echo -e "${GREEN}✅ Red sigma-network encontrada${NC}"
    info "Contenedores conectados:"
    docker network inspect "$NETWORK" --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null || echo "   (no se pudo obtener información)"
else
    warn "Red sigma-network no encontrada"
fi

# Resumen final
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📋 Resumen de validación:${NC}"
echo ""

if [ "$ALL_RUNNING" = true ]; then
    echo -e "   Contenedores: ${GREEN}✅ Todos corriendo${NC}"
else
    echo -e "   Contenedores: ${RED}❌ Algunos no están corriendo${NC}"
fi

echo ""
echo "   Comandos útiles:"
echo "   - Ver logs de todos los servicios:"
echo "     docker compose -f $COMPOSE_FILE logs -f"
echo ""
echo "   - Ver logs de un servicio específico:"
echo "     docker compose -f $COMPOSE_FILE logs -f postgres"
echo "     docker compose -f $COMPOSE_FILE logs -f api"
echo ""
echo "   - Ver estado detallado:"
echo "     docker compose -f $COMPOSE_FILE ps"
echo ""
echo "   - Reiniciar un servicio:"
echo "     docker compose -f $COMPOSE_FILE restart api"
echo ""
echo "   - Entrar al contenedor de PostgreSQL:"
echo "     docker compose -f $COMPOSE_FILE exec postgres psql -U ${DB_USER:-sigma} -d ${DB_NAME:-sigma_db}"
echo ""
echo "   - Verificar DATABASE_URL:"
echo "     docker compose -f $COMPOSE_FILE exec api env | grep DATABASE_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
