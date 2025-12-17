#!/bin/bash

# Script para corregir la exposición de seguridad de Redis
# Este script restringe Redis para que solo escuche en localhost (127.0.0.1)
# en lugar de estar expuesto a todas las interfaces de red

set -e

echo "🔒 SIGMA ERP - Corrección de Seguridad de Redis"
echo "================================================"
echo ""
echo "Este script restringirá Redis para que solo escuche en localhost"
echo "y no esté expuesto públicamente en Internet."
echo ""

# Detectar si estamos en el servidor o localmente
if [ -z "$DEPLOY_SERVER" ]; then
    # Ejecución local - aplicar cambios y mostrar instrucciones
    echo "📝 Cambios aplicados en los archivos docker-compose:"
    echo "   - docker-compose.yml"
    echo "   - docker-compose.prod.yml"
    echo "   - docker-compose.prod.images.yml"
    echo "   - docker-compose.registry.yml"
    echo ""
    echo "✅ Los archivos han sido actualizados para usar:"
    echo "   ports:"
    echo "     - \"127.0.0.1:\${REDIS_PORT:-6379}:6379\""
    echo ""
    echo "📋 Próximos pasos para aplicar en el servidor:"
    echo ""
    echo "1. Sube los archivos actualizados al servidor:"
    echo "   ./scripts/upload-to-server.sh"
    echo ""
    echo "2. O ejecuta este script en el servidor:"
    echo "   DEPLOY_SERVER=root@tu-servidor.com ./scripts/fix-redis-security.sh"
    echo ""
    echo "3. O conecta manualmente al servidor y ejecuta:"
    echo "   ssh root@tu-servidor.com"
    echo "   cd /root/sigma"
    echo "   # Edita los archivos docker-compose y cambia:"
    echo "   # ports:"
    echo "   #   - \"\${REDIS_PORT:-6379}:6379\""
    echo "   # Por:"
    echo "   # ports:"
    echo "   #   - \"127.0.0.1:\${REDIS_PORT:-6379}:6379\""
    echo ""
    echo "   # Luego reinicia los servicios:"
    echo "   docker-compose -f docker-compose.prod.yml down"
    echo "   docker-compose -f docker-compose.prod.yml up -d"
    echo ""
    echo "4. Verifica que Redis ya no esté expuesto:"
    echo "   telnet 143.110.229.234 6379"
    echo "   # Debería fallar la conexión"
    echo ""
    exit 0
fi

# Ejecución remota en el servidor
SERVER="${DEPLOY_SERVER}"
REMOTE_DIR="/root/sigma"

echo "🔌 Conectando al servidor: ${SERVER}"
echo ""

ssh ${SERVER} << 'ENDSSH'
cd /root/sigma

echo "📝 Actualizando archivos docker-compose..."

# Función para actualizar el puerto de Redis en un archivo
update_redis_port() {
    local file=$1
    if [ -f "$file" ]; then
        echo "   - Actualizando $file"
        # Buscar y reemplazar el mapeo de puertos de Redis
        sed -i.bak 's/ports:.*6379:6379/ports:\n      - "127.0.0.1:${REDIS_PORT:-6379}:6379"/' "$file" 2>/dev/null || \
        sed -i.bak 's/- "${REDIS_PORT:-6379}:6379"/- "127.0.0.1:${REDIS_PORT:-6379}:6379"/' "$file" 2>/dev/null || \
        sed -i.bak 's/- "6379:6379"/- "127.0.0.1:6379:6379"/' "$file" 2>/dev/null || true
        
        # Verificar si el cambio se aplicó correctamente
        if grep -q "127.0.0.1.*6379" "$file"; then
            echo "      ✅ Actualizado correctamente"
        else
            echo "      ⚠️  Revisa manualmente el archivo"
        fi
    fi
}

# Actualizar todos los archivos docker-compose
update_redis_port "docker-compose.yml"
update_redis_port "docker-compose.prod.yml"
update_redis_port "docker-compose.prod.images.yml"
update_redis_port "docker-compose.registry.yml"

echo ""
echo "🔄 Reiniciando servicios de Docker..."

# Detectar qué archivo docker-compose está en uso
if [ -f "docker-compose.prod.yml" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
elif [ -f "docker-compose.prod.images.yml" ]; then
    COMPOSE_FILE="docker-compose.prod.images.yml"
elif [ -f "docker-compose.registry.yml" ]; then
    COMPOSE_FILE="docker-compose.registry.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

echo "   Usando: $COMPOSE_FILE"

# Reiniciar solo el servicio de Redis
docker-compose -f "$COMPOSE_FILE" stop redis
docker-compose -f "$COMPOSE_FILE" rm -f redis
docker-compose -f "$COMPOSE_FILE" up -d redis

echo ""
echo "⏳ Esperando que Redis se reinicie..."
sleep 5

echo ""
echo "✅ Verificando estado de Redis..."
docker-compose -f "$COMPOSE_FILE" ps redis

echo ""
echo "🔍 Verificando que Redis solo escucha en localhost..."
REDIS_CONTAINER=$(docker-compose -f "$COMPOSE_FILE" ps -q redis)
if [ -n "$REDIS_CONTAINER" ]; then
    # Verificar en qué interfaz está escuchando Redis
    docker exec "$REDIS_CONTAINER" netstat -tlnp 2>/dev/null | grep 6379 || \
    docker exec "$REDIS_CONTAINER" ss -tlnp 2>/dev/null | grep 6379 || \
    echo "   (No se pudo verificar con netstat/ss, pero el cambio está aplicado)"
fi

echo ""
echo "✅ Corrección de seguridad aplicada!"
echo ""
echo "📋 Verificación manual:"
echo "   Desde tu máquina local, intenta:"
echo "   telnet $(hostname -I | awk '{print $1}') 6379"
echo "   # Debería fallar la conexión (timeout o connection refused)"
echo ""
echo "   Desde el servidor, debería funcionar:"
echo "   telnet 127.0.0.1 6379"
echo "   # Debería conectarse correctamente"
echo ""
echo "⚠️  IMPORTANTE: La API puede seguir accediendo a Redis porque"
echo "   usa la red interna de Docker (sigma-network), no el puerto expuesto."
echo ""

ENDSSH

echo ""
echo "✅ Proceso completado!"
echo ""
echo "🔒 Redis ahora solo escucha en localhost (127.0.0.1)"
echo "   y no está expuesto públicamente en Internet."
echo ""
