#!/bin/bash

# Script para validar que la aplicación está funcionando correctamente en producción

set -e

API_URL="${API_URL:-http://localhost:3040}"
WEB_URL="${WEB_URL:-http://localhost:3041}"
DB_CONTAINER="${DB_CONTAINER:-sigma-postgres}"
DB_USER="${DB_USER:-sigma}"
DB_NAME="${DB_NAME:-sigma_db}"

echo "🔍 Validando SIGMA ERP en Producción"
echo "======================================"
echo ""

# 1. Verificar que los contenedores están corriendo
echo "1️⃣ Verificando contenedores Docker..."
if docker ps | grep -q sigma-postgres && docker ps | grep -q sigma-api; then
    echo "   ✅ Contenedores corriendo"
    docker ps --filter "name=sigma" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -10
else
    echo "   ❌ Algunos contenedores no están corriendo"
    exit 1
fi
echo ""

# 2. Verificar salud de PostgreSQL
echo "2️⃣ Verificando PostgreSQL..."
if docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL está listo"
else
    echo "   ❌ PostgreSQL no está respondiendo"
    exit 1
fi
echo ""

# 3. Verificar datos en la base de datos
echo "3️⃣ Verificando datos en la base de datos..."
USER_COUNT=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
PROJECT_COUNT=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM projects;" 2>/dev/null | tr -d ' ')
CLIENT_COUNT=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM clients;" 2>/dev/null | tr -d ' ')

if [ "$USER_COUNT" -gt 0 ] && [ "$PROJECT_COUNT" -gt 0 ]; then
    echo "   ✅ Datos encontrados:"
    echo "      - Usuarios: $USER_COUNT"
    echo "      - Proyectos: $PROJECT_COUNT"
    echo "      - Clientes: $CLIENT_COUNT"
else
    echo "   ⚠️  Advertencia: Pocos datos encontrados"
fi
echo ""

# 4. Verificar health check de la API
echo "4️⃣ Verificando API..."
if command -v curl > /dev/null 2>&1; then
    API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health" 2>/dev/null || echo "000")
    if [ "$API_HEALTH" = "200" ]; then
        echo "   ✅ API está respondiendo (HTTP $API_HEALTH)"
        # Obtener respuesta completa
        API_RESPONSE=$(curl -s "$API_URL/api/health" 2>/dev/null || echo "")
        if [ -n "$API_RESPONSE" ]; then
            echo "      Respuesta: $API_RESPONSE"
        fi
    else
        echo "   ❌ API no está respondiendo correctamente (HTTP $API_HEALTH)"
        echo "      Intenta: curl $API_URL/api/health"
    fi
else
    echo "   ⚠️  curl no está disponible, saltando verificación de API"
fi
echo ""

# 5. Verificar que el web está respondiendo
echo "5️⃣ Verificando Web..."
if command -v curl > /dev/null 2>&1; then
    WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL" 2>/dev/null || echo "000")
    if [ "$WEB_STATUS" = "200" ]; then
        echo "   ✅ Web está respondiendo (HTTP $WEB_STATUS)"
    else
        echo "   ⚠️  Web respondió con HTTP $WEB_STATUS (puede estar iniciando)"
    fi
else
    echo "   ⚠️  curl no está disponible, saltando verificación de Web"
fi
echo ""

# 6. Verificar logs recientes de la API (últimos errores)
echo "6️⃣ Verificando logs recientes de la API..."
RECENT_ERRORS=$(docker logs sigma-api --tail 50 2>&1 | grep -i "error\|exception\|failed" | head -5 || echo "")
if [ -z "$RECENT_ERRORS" ]; then
    echo "   ✅ No se encontraron errores recientes en los logs"
else
    echo "   ⚠️  Errores recientes encontrados:"
    echo "$RECENT_ERRORS" | sed 's/^/      /'
fi
echo ""

# 7. Probar login si tenemos credenciales de prueba
echo "7️⃣ Verificando endpoint de login..."
if command -v curl > /dev/null 2>&1; then
    # Intentar obtener un usuario de prueba
    TEST_EMAIL=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT email FROM users WHERE is_active = true LIMIT 1;" 2>/dev/null | tr -d ' ' || echo "")
    
    if [ -n "$TEST_EMAIL" ]; then
        echo "   ℹ️  Usuario de prueba encontrado: $TEST_EMAIL"
        LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"test123\"}" 2>/dev/null || echo "")
        
        if echo "$LOGIN_RESPONSE" | grep -q "token\|accessToken"; then
            echo "   ✅ Endpoint de login funciona (con credenciales válidas)"
        elif echo "$LOGIN_RESPONSE" | grep -q "Invalid credentials\|Unauthorized"; then
            echo "   ✅ Endpoint de login responde correctamente (credenciales inválidas esperadas)"
        else
            echo "   ⚠️  Respuesta inesperada del login"
        fi
    else
        echo "   ⚠️  No se encontró usuario para probar login"
    fi
else
    echo "   ⚠️  curl no está disponible, saltando verificación de login"
fi
echo ""

# Resumen final
echo "======================================"
echo "📊 Resumen de Validación"
echo "======================================"
echo ""
echo "✅ Validaciones completadas"
echo ""
echo "🔗 URLs:"
echo "   - API: $API_URL"
echo "   - Web: $WEB_URL"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Accede a la aplicación web: $WEB_URL"
echo "   2. Intenta hacer login con tus credenciales"
echo "   3. Verifica que puedes ver proyectos, clientes, etc."
echo ""
echo "🐛 Si hay problemas:"
echo "   - Revisa logs: docker logs sigma-api"
echo "   - Revisa logs: docker logs sigma-web"
echo "   - Verifica estado: docker-compose ps"
echo ""
