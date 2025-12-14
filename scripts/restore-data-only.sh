#!/bin/bash

# Script para restaurar solo los datos (COPY) de un backup SQL
# Ejecuta las secciones COPY en el orden correcto respetando dependencias

set -e

if [ -z "$1" ]; then
    echo "❌ Uso: $0 <archivo_backup.sql[.gz]>"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME=${DB_NAME:-sigma_db}
DB_USER=${DB_USER:-sigma}

echo "📦 Restaurando datos desde: $BACKUP_FILE"

# Orden de restauración respetando dependencias
TABLES_ORDER=(
    "organizations"
    "roles"
    "permissions"
    "role_permissions"
    "users"
    "accounts"
    "categories"
    "phases"
    "clients"
    "suppliers"
    "projects"
    "accounts_receivable"
    "accounts_payable"
    "payment_complements"
    "invoices"
    "quotes"
    "recoveries"
    "flow_recoveries"
    "fixed_costs"
    "requisitions"
    "journal_entries"
    "journal_lines"
    "organization_modules"
    "sprints"
    "tasks"
    "comments"
    "attachments"
    "time_entries"
    "expenses"
    "purchase_orders"
    "_ProjectMembers"
    "_ProjectOwners"
    "_SprintMembers"
)

# Función para extraer y ejecutar COPY de una tabla
restore_table() {
    local table="$1"
    echo "  📋 Restaurando tabla: $table"
    
    # Extraer la sección COPY para esta tabla
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        gunzip -c "$BACKUP_FILE" | awk "
            /^COPY public\\.$table / { in_copy=1; print; next }
            in_copy && /^\\\\\\.$/ { print; in_copy=0; exit }
            in_copy { print }
        " | docker exec -i sigma-postgres psql -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1
    else
        awk "
            /^COPY public\\.$table / { in_copy=1; print; next }
            in_copy && /^\\\\\\.$/ { print; in_copy=0; exit }
            in_copy { print }
        " < "$BACKUP_FILE" | docker exec -i sigma-postgres psql -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        echo "    ✅ $table restaurada"
    else
        echo "    ⚠️  Error restaurando $table (puede estar vacía o tener dependencias)"
    fi
}

# Restaurar tablas en orden
for table in "${TABLES_ORDER[@]}"; do
    restore_table "$table"
done

echo ""
echo "✅ Restauración de datos completada"
