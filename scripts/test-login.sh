#!/bin/bash

# Script para probar el login con un usuario

set -e

API_URL="${API_URL:-http://localhost:3040}"
EMAIL="${1:-user@example.com}"
PASSWORD="${2}"

if [ -z "$PASSWORD" ]; then
    echo "🔐 Probando login para: $EMAIL"
    echo "   (Sin contraseña proporcionada, solo probando el endpoint)"
    echo ""
    
    RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$EMAIL\",\"password\":\"test\"}")
    
    echo "Respuesta:"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
else
    echo "🔐 Probando login para: $EMAIL"
    echo ""
    
    RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
    
    echo "Respuesta:"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
    
    # Verificar si el login fue exitoso
    if echo "$RESPONSE" | grep -q "accessToken\|token"; then
        echo ""
        echo "✅ Login exitoso!"
        TOKEN=$(echo "$RESPONSE" | jq -r '.data.accessToken // .accessToken // .token' 2>/dev/null || echo "")
        if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
            echo "   Token: ${TOKEN:0:50}..."
            echo ""
            echo "🧪 Probando endpoint protegido (obtener perfil)..."
            PROFILE=$(curl -s -X GET "$API_URL/api/auth/profile" \
                -H "Authorization: Bearer $TOKEN")
            echo "$PROFILE" | jq . 2>/dev/null || echo "$PROFILE"
        fi
    else
        echo ""
        echo "❌ Login falló"
    fi
fi
