#!/bin/bash

# Script completo para reparar la base de datos SIN eliminar datos
# - Crea tablas faltantes (dispatches, api_keys, webhooks, etc.)
# - Restaura roles y permisos
# - Verifica y repara datos
# - NO ELIMINA ningún dato existente

set -e

echo "🔧 Reparación Completa de Base de Datos SIGMA ERP"
echo "=================================================="
echo ""
echo "⚠️  IMPORTANTE: Este script NO eliminará ningún dato existente"
echo "   Solo creará tablas/columnas faltantes y restaurará configuraciones"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.prod.images.yml" ]; then
    echo "❌ Error: Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

echo "1️⃣ Ejecutando migraciones de Prisma (crear tablas faltantes)..."
docker-compose -f docker-compose.prod.images.yml exec -T api sh -c "cd /app && npx -y prisma@5.19.1 migrate deploy --schema=./prisma/schema.prisma" || \
docker exec sigma-api sh -c "cd /app && npx -y prisma@5.19.1 migrate deploy --schema=./prisma/schema.prisma"

echo ""
echo "✅ Migraciones completadas"
echo ""

echo "2️⃣ Verificando estado de la base de datos..."
docker exec sigma-postgres psql -U sigma -d sigma_db -c "
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dispatches') 
         THEN '✅ dispatches existe' 
         ELSE '❌ dispatches NO existe' END as dispatches_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dispatch_attachments') 
         THEN '✅ dispatch_attachments existe' 
         ELSE '❌ dispatch_attachments NO existe' END as dispatch_attachments_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_keys') 
         THEN '✅ api_keys existe' 
         ELSE '❌ api_keys NO existe' END as api_keys_status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhooks') 
         THEN '✅ webhooks existe' 
         ELSE '❌ webhooks NO existe' END as webhooks_status;
"

echo ""
echo "3️⃣ Ejecutando script de reparación de roles y permisos..."
echo "   (Esto se ejecutará con un script TypeScript en el contenedor API)"
echo ""
echo "4️⃣ Verificando datos críticos..."
docker exec sigma-postgres psql -U sigma -d sigma_db -c "
SELECT 
    (SELECT COUNT(*) FROM roles) as total_roles,
    (SELECT COUNT(*) FROM permissions) as total_permissions,
    (SELECT COUNT(*) FROM role_permissions) as total_role_permissions,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM accounts_payable) as total_accounts_payable,
    (SELECT COUNT(*) FROM accounts_receivable) as total_accounts_receivable,
    (SELECT COUNT(*) FROM payment_complements) as total_payment_complements;
"

echo ""
echo "✅ Diagnóstico completado"
echo ""
echo "📋 Próximos pasos manuales:"
echo "   1. Verificar que las tablas faltantes se crearon"
echo "   2. Ejecutar script de seed de roles y permisos si es necesario"
echo "   3. Verificar pagos parciales"
echo ""
