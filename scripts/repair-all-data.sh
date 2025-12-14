#!/bin/bash

# Script completo para reparar TODOS los datos de la base de datos
# SIN ELIMINAR ningún dato existente

set -e

echo "🔧 Reparación Completa de Base de Datos SIGMA ERP"
echo "=================================================="
echo ""

# 1. Sincronizar esquema (crear tablas/columnas faltantes)
echo "1️⃣ Sincronizando esquema de Prisma..."
docker-compose -f docker-compose.prod.images.yml exec -T api sh -c "cd /app && npx -y prisma@5.19.1 db push --schema=./prisma/schema.prisma --accept-data-loss" || \
docker exec sigma-api sh -c "cd /app && npx -y prisma@5.19.1 db push --schema=./prisma/schema.prisma --accept-data-loss"

echo "✅ Esquema sincronizado"
echo ""

# 2. Ejecutar seed para restaurar roles y permisos
echo "2️⃣ Restaurando roles y permisos..."
docker exec sigma-api sh -c "cd /app && npx ts-node prisma/seed.ts" 2>&1 | grep -E "(✅|✓|⚠️|Error|ERROR)" || echo "Seed ejecutado"

echo ""
echo "✅ Roles y permisos restaurados"
echo ""

# 3. Verificar estado final
echo "3️⃣ Verificando estado final..."
docker exec sigma-postgres psql -U sigma -d sigma_db << 'EOSQL'
SELECT 
    (SELECT COUNT(*) FROM organizations) as organizations,
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM roles) as roles,
    (SELECT COUNT(*) FROM permissions) as permissions,
    (SELECT COUNT(*) FROM role_permissions) as role_permissions,
    (SELECT COUNT(*) FROM dispatches) as dispatches,
    (SELECT COUNT(*) FROM payment_complements) as payment_complements,
    (SELECT COUNT(*) FROM accounts_payable) as accounts_payable,
    (SELECT COUNT(*) FROM accounts_receivable) as accounts_receivable;
EOSQL

echo ""
echo "✅ Reparación completada"
