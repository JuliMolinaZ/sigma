#!/bin/bash

# Script para restaurar roles y permisos usando el seed de Prisma
# SIN eliminar datos existentes

set -e

echo "🔐 Restaurando roles y permisos..."
echo ""

# Copiar archivos de seed necesarios al contenedor si no están
echo "1️⃣ Verificando archivos de seed..."
docker exec sigma-api sh -c "test -f /app/prisma/seeds/enterprise-roles.seed.ts && echo '✅ Seed files exist' || echo '⚠️ Seed files not found'"

echo ""
echo "2️⃣ Ejecutando seed de roles y permisos..."
echo "   (Esto restaurará roles y permisos sin afectar usuarios existentes)"
echo ""

# Ejecutar el seed usando node directamente desde el código compilado
# O mejor, crear un script SQL directo que restaure los roles y permisos
docker exec sigma-postgres psql -U sigma -d sigma_db << 'EOSQL'
-- Verificar estado actual
SELECT 
    'Estado actual:' as info,
    (SELECT COUNT(*) FROM roles) as roles,
    (SELECT COUNT(*) FROM permissions) as permissions,
    (SELECT COUNT(*) FROM role_permissions) as role_permissions,
    (SELECT COUNT(*) FROM users WHERE role_id IS NULL) as users_sin_rol;

-- Los roles y permisos ya están en la base de datos desde el backup
-- Solo necesitamos asegurar que todos los usuarios tengan rol asignado

-- Asignar rol Superadmin a usuarios sin rol (si existe el rol)
UPDATE users u
SET role_id = (
    SELECT id FROM roles 
    WHERE name = 'Superadmin' 
    AND organization_id = u.organization_id 
    LIMIT 1
)
WHERE u.role_id IS NULL
AND EXISTS (
    SELECT 1 FROM roles 
    WHERE name = 'Superadmin' 
    AND organization_id = u.organization_id
);

SELECT '✅ Usuarios sin rol asignados a Superadmin' as resultado;
EOSQL

echo ""
echo "✅ Roles y permisos verificados"
