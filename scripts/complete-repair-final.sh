#!/bin/bash

# Script COMPLETO FINAL para reparar TODOS los problemas
# SIN ELIMINAR ningún dato

set -e

echo "🔧 Reparación Final Completa de Base de Datos SIGMA ERP"
echo "========================================================"
echo ""
echo "⚠️  Este script NO eliminará ningún dato existente"
echo ""

# 1. Recalcular montos pagados (ya hecho, pero verificamos)
echo "1️⃣ Verificando payment_complements y montos..."
docker exec sigma-postgres psql -U sigma -d sigma_db -c "
SELECT 
    'Payment Complements' as item, COUNT(*)::text as count FROM payment_complements
UNION ALL
SELECT 'AR con pagos', COUNT(*)::text FROM accounts_receivable WHERE monto_pagado > 0
UNION ALL
SELECT 'AR parciales', COUNT(*)::text FROM accounts_receivable WHERE status = 'PARTIAL'
UNION ALL
SELECT 'AR pagadas', COUNT(*)::text FROM accounts_receivable WHERE status = 'PAID'
UNION ALL
SELECT 'AP con pagos', COUNT(*)::text FROM accounts_payable WHERE monto_pagado > 0;
"

echo ""

# 2. Verificar y asignar roles a usuarios sin rol
echo "2️⃣ Verificando usuarios sin rol..."
docker exec sigma-postgres psql -U sigma -d sigma_db << 'EOSQL'
-- Asignar rol Superadmin a usuarios sin rol (si existe)
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

SELECT 
    COUNT(*) as total_users,
    COUNT(role_id) as users_with_role,
    COUNT(*) - COUNT(role_id) as users_without_role
FROM users;
EOSQL

echo ""

# 3. Estado final completo
echo "3️⃣ Estado Final Completo:"
docker exec sigma-postgres psql -U sigma -d sigma_db << 'EOSQL'
SELECT 
    '=== RESUMEN GENERAL ===' as titulo;

SELECT 
    'Organizations' as item, COUNT(*)::text as count FROM organizations
UNION ALL SELECT 'Users', COUNT(*)::text FROM users
UNION ALL SELECT 'Roles', COUNT(*)::text FROM roles
UNION ALL SELECT 'Permissions', COUNT(*)::text FROM permissions
UNION ALL SELECT 'Role Permissions', COUNT(*)::text FROM role_permissions
UNION ALL SELECT 'Projects', COUNT(*)::text FROM projects
UNION ALL SELECT 'Clients', COUNT(*)::text FROM clients
UNION ALL SELECT 'Suppliers', COUNT(*)::text FROM suppliers
UNION ALL SELECT 'Accounts Payable', COUNT(*)::text FROM accounts_payable
UNION ALL SELECT 'Accounts Receivable', COUNT(*)::text FROM accounts_receivable
UNION ALL SELECT 'Payment Complements', COUNT(*)::text FROM payment_complements
UNION ALL SELECT 'Dispatches', COUNT(*)::text FROM dispatches
UNION ALL SELECT 'Invoices', COUNT(*)::text FROM invoices
UNION ALL SELECT 'Quotes', COUNT(*)::text FROM quotes;

SELECT '' as blank;
SELECT '=== CUENTAS POR COBRAR ===' as titulo;
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN monto_pagado > 0 THEN 1 END) as con_pagos,
    COUNT(CASE WHEN status = 'PARTIAL' THEN 1 END) as parciales,
    COUNT(CASE WHEN status = 'PAID' THEN 1 END) as pagadas
FROM accounts_receivable;

SELECT '' as blank;
SELECT '=== CUENTAS POR PAGAR ===' as titulo;
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN monto_pagado > 0 THEN 1 END) as con_pagos,
    COUNT(CASE WHEN status = 'PARTIAL' THEN 1 END) as parciales,
    COUNT(CASE WHEN status = 'PAID' THEN 1 END) as pagadas
FROM accounts_payable;
EOSQL

echo ""
echo "✅ Reparación completada!"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Verifica que la aplicación funciona correctamente"
echo "   2. Prueba el login y navegación"
echo "   3. Verifica que los pagos parciales se muestran correctamente"
echo ""
