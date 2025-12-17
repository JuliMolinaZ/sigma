#!/bin/bash

# Script URGENTE para corregir la exposición de seguridad de Redis
# Ejecutar directamente en el servidor

set -e

echo "🔒 CORRECCIÓN URGENTE DE SEGURIDAD - REDIS"
echo "=========================================="
echo ""

# Detectar el archivo docker-compose en uso
if [ -f "docker-compose.prod.yml" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
elif [ -f "docker-compose.prod.images.yml" ]; then
    COMPOSE_FILE="docker-compose.prod.images.yml"
elif [ -f "docker-compose.registry.yml" ]; then
    COMPOSE_FILE="docker-compose.registry.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

echo "📝 Archivo detectado: $COMPOSE_FILE"
echo ""

# Actualizar el archivo docker-compose
echo "🔧 Actualizando configuración de Redis..."

# Crear backup
cp "$COMPOSE_FILE" "${COMPOSE_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# Actualizar el puerto de Redis para que solo escuche en localhost
sed -i 's/- "${REDIS_PORT:-6379}:6379"/- "127.0.0.1:${REDIS_PORT:-6379}:6379"/' "$COMPOSE_FILE" 2>/dev/null || \
sed -i 's/- "6379:6379"/- "127.0.0.1:6379:6379"/' "$COMPOSE_FILE" 2>/dev/null || \
sed -i 's/6379:6379/127.0.0.1:6379:6379/' "$COMPOSE_FILE"

# Verificar el cambio
if grep -q "127.0.0.1.*6379" "$COMPOSE_FILE"; then
    echo "✅ Configuración actualizada correctamente"
else
    echo "⚠️  Revisa manualmente el archivo $COMPOSE_FILE"
    echo "   Busca la sección 'redis:' y cambia:"
    echo "   ports:"
    echo "     - \"\${REDIS_PORT:-6379}:6379\""
    echo "   Por:"
    echo "   ports:"
    echo "     - \"127.0.0.1:\${REDIS_PORT:-6379}:6379\""
    exit 1
fi

echo ""
echo "🔄 Reiniciando servicio Redis..."

# Detener y recrear el contenedor de Redis
docker-compose -f "$COMPOSE_FILE" stop redis
docker-compose -f "$COMPOSE_FILE" rm -f redis
docker-compose -f "$COMPOSE_FILE" up -d redis

echo ""
echo "⏳ Esperando que Redis se reinicie..."
sleep 5

echo ""
echo "✅ Verificando estado..."
docker-compose -f "$COMPOSE_FILE" ps redis

echo ""
echo "🔍 Verificando que Redis solo escucha en localhost..."
REDIS_CONTAINER=$(docker-compose -f "$COMPOSE_FILE" ps -q redis)
if [ -n "$REDIS_CONTAINER" ]; then
    echo "   Contenedor: $REDIS_CONTAINER"
    docker port "$REDIS_CONTAINER" | grep 6379 || echo "   ✅ Puerto no expuesto públicamente"
fi

echo ""
echo "✅ CORRECCIÓN APLICADA!"
echo ""
echo "📋 Verificación:"
echo "   Desde fuera del servidor, ejecuta:"
echo "   telnet 143.110.229.234 6379"
echo "   # Debería fallar (timeout o connection refused)"
echo ""
echo "   Desde el servidor, debería funcionar:"
echo "   telnet 127.0.0.1 6379"
echo "   # Debería conectarse (presiona Ctrl+] y luego 'quit' para salir)"
echo ""
