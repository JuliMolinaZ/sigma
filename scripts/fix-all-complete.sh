#!/bin/bash

# Script COMPLETO para reparar TODOS los problemas de la base de datos
# SIN ELIMINAR ningún dato existente

set -e

echo "🔧 Reparación Completa de Base de Datos SIGMA ERP"
echo "=================================================="
echo ""
echo "⚠️  Este script NO eliminará ningún dato existente"
echo ""

# 1. Recalcular montos pagados en cuentas por cobrar y pagar
echo "1️⃣ Recalculando montos pagados..."
docker exec sigma-postgres psql -U sigma -d sigma_db << 'EOSQL'
-- Recalcular montos pagados para Accounts Receivable
UPDATE accounts_receivable ar
SET 
    monto_pagado = COALESCE((
        SELECT SUM(pc.monto)
        FROM payment_complements pc
        WHERE pc.account_receivable_id = ar.id
    ), 0),
    monto_restante = ar.monto - COALESCE((
        SELECT SUM(pc.monto)
        FROM payment_complements pc
        WHERE pc.account_receivable_id = ar.id
    ), 0)
WHERE EXISTS (
    SELECT 1 FROM payment_complements pc 
    WHERE pc.account_receivable_id = ar.id
);

-- Recalcular montos pagados para Accounts Payable
UPDATE accounts_payable ap
SET 
    monto_pagado = COALESCE((
        SELECT SUM(pc.monto)
        FROM payment_complements pc
        WHERE pc.account_payable_id = ap.id
    ), 0),
    monto_restante = CASE 
        WHEN ap.monto_restante IS NOT NULL THEN 
            ap.monto - COALESCE((
                SELECT SUM(pc.monto)
                FROM payment_complements pc
                WHERE pc.account_payable_id = ap.id
            ), 0)
        ELSE NULL
    END
WHERE EXISTS (
    SELECT 1 FROM payment_complements pc 
    WHERE pc.account_payable_id = ap.id
);

-- Actualizar status basado en montos para AR
UPDATE accounts_receivable
SET status = CASE
    WHEN monto_restante <= 0 OR monto_restante IS NULL THEN 'PAID'
    WHEN monto_pagado > 0 THEN 'PARTIAL'
    ELSE 'PENDING'
END
WHERE monto_pagado > 0 OR monto_restante <= 0;

-- Actualizar status y pagado para AP
UPDATE accounts_payable
SET status = CASE
    WHEN monto_restante IS NOT NULL AND monto_restante <= 0 THEN 'PAID'
    WHEN monto_pagado > 0 THEN 'PARTIAL'
    ELSE 'PENDING'
END,
pagado = CASE
    WHEN monto_restante IS NOT NULL AND monto_restante <= 0 THEN true
    WHEN monto_pagado > 0 THEN true
    ELSE false
END
WHERE monto_pagado > 0 OR (monto_restante IS NOT NULL AND monto_restante <= 0);

SELECT 'Montos recalculados' as status;
EOSQL

echo "   ✅ Montos recalculados"
echo ""

# 2. Verificar roles y permisos
echo "2️⃣ Verificando roles y permisos..."
docker exec sigma-postgres psql -U sigma -d sigma_db << 'EOSQL'
-- Verificar usuarios sin rol
SELECT 
    COUNT(*) as total_users,
    COUNT(role_id) as users_with_role,
    COUNT(*) - COUNT(role_id) as users_without_role
FROM users;

-- Mostrar usuarios sin rol (si los hay)
SELECT id, email, first_name, last_name 
FROM users 
WHERE role_id IS NULL 
LIMIT 10;
EOSQL

echo ""

# 3. Estado final completo
echo "3️⃣ Estado final de la base de datos:"
docker exec sigma-postgres psql -U sigma -d sigma_db << 'EOSQL'
SELECT 
    'Organizations' as item, COUNT(*)::text as count FROM organizations
UNION ALL SELECT 'Users', COUNT(*)::text FROM users
UNION ALL SELECT 'Roles', COUNT(*)::text FROM roles
UNION ALL SELECT 'Permissions', COUNT(*)::text FROM permissions
UNION ALL SELECT 'Role Permissions', COUNT(*)::text FROM role_permissions
UNION ALL SELECT 'Payment Complements', COUNT(*)::text FROM payment_complements
UNION ALL SELECT 'Accounts Payable', COUNT(*)::text FROM accounts_payable
UNION ALL SELECT 'Accounts Receivable', COUNT(*)::text FROM accounts_receivable
UNION ALL SELECT 'Dispatches', COUNT(*)::text FROM dispatches
UNION ALL SELECT 'Projects', COUNT(*)::text FROM projects
UNION ALL SELECT 'Clients', COUNT(*)::text FROM clients;
EOSQL

echo ""
echo "✅ Reparación completada!"
echo ""
