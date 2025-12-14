#!/bin/bash

# Script FINAL completo para reparar TODOS los problemas
# SIN ELIMINAR ningún dato

set -e

echo "🔧 Reparación Final Completa de Base de Datos"
echo "=============================================="
echo ""

# 1. Recalcular montos pagados
echo "1️⃣ Recalculando montos pagados en Accounts Receivable..."
docker exec sigma-postgres psql -U sigma -d sigma_db << 'EOSQL'
UPDATE accounts_receivable ar
SET monto_pagado = subquery.total
FROM (
    SELECT account_receivable_id, SUM(monto) as total
    FROM payment_complements
    WHERE account_receivable_id IS NOT NULL
    GROUP BY account_receivable_id
) AS subquery
WHERE ar.id = subquery.account_receivable_id;

UPDATE accounts_receivable
SET 
    monto_restante = monto - monto_pagado,
    status = CASE
        WHEN (monto - monto_pagado) <= 0 THEN 'PAID'
        WHEN monto_pagado > 0 THEN 'PARTIAL'
        ELSE status
    END
WHERE monto_pagado > 0;

SELECT '✅ AR actualizadas' as status;
EOSQL

echo ""

# 2. Hacer lo mismo para Accounts Payable
echo "2️⃣ Recalculando montos pagados en Accounts Payable..."
docker exec sigma-postgres psql -U sigma -d sigma_db << 'EOSQL'
UPDATE accounts_payable ap
SET monto_pagado = subquery.total
FROM (
    SELECT account_payable_id, SUM(monto) as total
    FROM payment_complements
    WHERE account_payable_id IS NOT NULL
    GROUP BY account_payable_id
) AS subquery
WHERE ap.id = subquery.account_payable_id;

UPDATE accounts_payable
SET 
    monto_restante = monto - monto_pagado,
    status = CASE
        WHEN (monto - COALESCE(monto_pagado, 0)) <= 0 THEN 'PAID'
        WHEN monto_pagado > 0 THEN 'PARTIAL'
        ELSE status
    END,
    pagado = CASE
        WHEN (monto - COALESCE(monto_pagado, 0)) <= 0 THEN true
        WHEN monto_pagado > 0 THEN true
        ELSE pagado
    END
WHERE monto_pagado > 0;

SELECT '✅ AP actualizadas' as status;
EOSQL

echo ""

# 3. Estado final
echo "3️⃣ Estado Final:"
docker exec sigma-postgres psql -U sigma -d sigma_db << 'EOSQL'
SELECT 
    'Payment Complements' as item, COUNT(*)::text as count FROM payment_complements
UNION ALL
SELECT 'AR con pagos', COUNT(*)::text FROM accounts_receivable WHERE monto_pagado > 0
UNION ALL
SELECT 'AR parciales', COUNT(*)::text FROM accounts_receivable WHERE status = 'PARTIAL'
UNION ALL
SELECT 'AR pagadas', COUNT(*)::text FROM accounts_receivable WHERE status = 'PAID'
UNION ALL
SELECT 'AP con pagos', COUNT(*)::text FROM accounts_payable WHERE monto_pagado > 0
UNION ALL
SELECT 'Dispatches', COUNT(*)::text FROM dispatches
UNION ALL
SELECT 'Roles', COUNT(*)::text FROM roles
UNION ALL
SELECT 'Permissions', COUNT(*)::text FROM permissions;
EOSQL

echo ""
echo "✅ Reparación completada!"
echo ""
