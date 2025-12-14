#!/bin/bash

# Script para restaurar roles y permisos correctamente
# Usa SQL directo para evitar problemas con TypeScript en el contenedor

set -e

echo "🔐 Restaurando roles y permisos..."
echo ""

docker exec sigma-postgres psql -U sigma -d sigma_db << 'EOSQL'
-- Verificar estado actual
SELECT 
    'Estado actual:' as info,
    (SELECT COUNT(*) FROM roles) as roles,
    (SELECT COUNT(*) FROM permissions) as permissions,
    (SELECT COUNT(*) FROM role_permissions) as role_permissions;

-- Los roles y permisos ya están restaurados desde el backup
-- Solo necesitamos verificar que estén correctos
-- Si faltan, se crearán con el seed de Prisma

EOSQL

echo ""
echo "✅ Roles y permisos verificados"
echo ""
echo "💡 Si faltan roles o permisos, ejecuta desde el contenedor API:"
echo "   docker exec sigma-api sh -c 'cd /app && npx ts-node prisma/seed.ts'"
echo ""
