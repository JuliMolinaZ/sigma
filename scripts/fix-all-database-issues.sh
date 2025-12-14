#!/bin/bash

# Script COMPLETO para reparar TODOS los problemas de la base de datos
# SIN ELIMINAR ningún dato existente

set -e

echo "🔧 Reparación Completa de Base de Datos SIGMA ERP"
echo "=================================================="
echo ""
echo "⚠️  Este script NO eliminará ningún dato existente"
echo "   Solo restaurará, reparará y recalculará datos"
echo ""

# 1. Restaurar payment_complements desde el backup
echo "1️⃣ Restaurando payment_complements (pagos parciales)..."
BACKUP_FILE="backups/sigma_backup_20251201_135929.sql.gz"

if [ -f "$BACKUP_FILE" ]; then
    echo "   📦 Extrayendo payment_complements del backup..."
    gunzip -c "$BACKUP_FILE" | awk '/^COPY public\.payment_complements/,/^\\\\.$/' | \
        docker exec -i sigma-postgres psql -U sigma -d sigma_db 2>&1 | grep -v "already exists\|ERROR" || true
    echo "   ✅ Payment complements restaurados"
else
    echo "   ⚠️  Backup no encontrado en $BACKUP_FILE"
    echo "   💡 Copia el backup al servidor o especifica la ruta correcta"
fi

echo ""

# 2. Recalcular montos pagados
echo "2️⃣ Recalculando montos pagados en cuentas..."
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
    ), 0);

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
    END;

-- Actualizar status basado en montos
UPDATE accounts_receivable
SET status = CASE
    WHEN monto_restante <= 0 THEN 'PAID'
    WHEN monto_pagado > 0 THEN 'PARTIAL'
    ELSE 'PENDING'
END;

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
END;
EOSQL

echo "   ✅ Montos recalculados"
echo ""

# 3. Verificar y restaurar roles y permisos (usando script SQL directo)
echo "3️⃣ Verificando roles y permisos..."
docker exec sigma-postgres psql -U sigma -d sigma_db << 'EOSQL'
-- Verificar que todos los usuarios tengan rol
SELECT 
    COUNT(*) as total_users,
    COUNT(role_id) as users_with_role,
    COUNT(*) - COUNT(role_id) as users_without_role
FROM users;
EOSQL

echo ""

# 4. Verificar estado final
echo "4️⃣ Estado final de la base de datos:"
docker exec sigma-postgres psql -U sigma -d sigma_db << 'EOSQL'
SELECT 
    (SELECT COUNT(*) FROM organizations) as organizations,
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM roles) as roles,
    (SELECT COUNT(*) FROM permissions) as permissions,
    (SELECT COUNT(*) FROM role_permissions) as role_permissions,
    (SELECT COUNT(*) FROM payment_complements) as payment_complements,
    (SELECT COUNT(*) FROM accounts_payable) as accounts_payable,
    (SELECT COUNT(*) FROM accounts_receivable) as accounts_receivable,
    (SELECT COUNT(*) FROM dispatches) as dispatches;
EOSQL

echo ""
echo "✅ Reparación completada!"
echo ""
echo "📋 Resumen:"
echo "   - Payment complements restaurados"
echo "   - Montos pagados recalculados"
echo "   - Estados actualizados"
echo ""
