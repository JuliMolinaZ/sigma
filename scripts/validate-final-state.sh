#!/bin/bash

# Script para validar el estado final de la base de datos

set -e

echo "📊 Validación Final del Estado de la Base de Datos"
echo "==================================================="
echo ""

docker exec sigma-postgres psql -U sigma -d sigma_db << 'EOSQL'
-- Resumen completo
SELECT '📋 RESUMEN GENERAL' as titulo;

SELECT 
    'Organizations' as item, COUNT(*)::text as count FROM organizations
UNION ALL SELECT 'Users', COUNT(*)::text FROM users
UNION ALL SELECT 'Roles', COUNT(*)::text FROM roles
UNION ALL SELECT 'Permissions', COUNT(*)::text FROM permissions
UNION ALL SELECT 'Role Permissions', COUNT(*)::text FROM role_permissions
UNION ALL SELECT 'Users sin rol', (SELECT COUNT(*)::text FROM users WHERE role_id IS NULL)
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
SELECT '💰 CUENTAS POR COBRAR' as titulo;
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN monto_pagado > 0 THEN 1 END) as con_pagos,
    COUNT(CASE WHEN status = 'PARTIAL' THEN 1 END) as parciales,
    COUNT(CASE WHEN status = 'PAID' THEN 1 END) as pagadas,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pendientes
FROM accounts_receivable;

SELECT '' as blank;
SELECT '💳 CUENTAS POR PAGAR' as titulo;
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN monto_pagado > 0 THEN 1 END) as con_pagos,
    COUNT(CASE WHEN status = 'PARTIAL' THEN 1 END) as parciales,
    COUNT(CASE WHEN status = 'PAID' THEN 1 END) as pagadas,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pendientes
FROM accounts_payable;

SELECT '' as blank;
SELECT '🔐 ROLES Y PERMISOS' as titulo;
SELECT 
    (SELECT COUNT(*) FROM roles) as roles,
    (SELECT COUNT(*) FROM permissions) as permissions,
    (SELECT COUNT(*) FROM role_permissions) as role_permissions,
    (SELECT COUNT(*) FROM users WHERE role_id IS NULL) as users_sin_rol;

EOSQL

echo ""
echo "✅ Validación completada"
