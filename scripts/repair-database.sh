#!/bin/bash

# Script para reparar la base de datos completamente
# Restaura roles, permisos, verifica pagos parciales, etc.
# SIN ELIMINAR ningún dato existente

set -e

echo "🔧 Reparación Completa de Base de Datos SIGMA ERP"
echo "=================================================="
echo ""
echo "⚠️  Este script NO eliminará ningún dato existente"
echo "   Solo restaurará configuraciones y reparará datos"
echo ""

# Ejecutar script TypeScript de reparación desde el contenedor API
echo "1️⃣ Ejecutando script de reparación..."
docker-compose -f docker-compose.prod.images.yml exec -T api sh -c "cd /app && ts-node scripts/repair-database-complete.ts" || \
docker exec sigma-api sh -c "cd /app && npx ts-node scripts/repair-database-complete.ts" || \
docker exec sigma-api sh -c "cd /app && node -r ts-node/register scripts/repair-database-complete.ts"

echo ""
echo "✅ Reparación completada"
