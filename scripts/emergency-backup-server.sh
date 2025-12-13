#!/bin/bash

# ===========================================
# Script de EMERGENCIA para extraer backup
# Ejecutar DIRECTAMENTE en el servidor
# ===========================================

set -e

BACKUP_DIR="/root/sigma/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/sigma_emergency_backup_${TIMESTAMP}.sql"

echo "🚨 SIGMA ERP - Backup de Emergencia"
echo "===================================="
echo ""

# Crear directorio si no existe
mkdir -p "${BACKUP_DIR}"

# Método 1: Docker Compose
echo "1️⃣ Intentando con docker-compose..."
if command -v docker-compose &> /dev/null; then
    cd /root/sigma 2>/dev/null || cd /home/*/sigma 2>/dev/null || true
    
    if [ -f "docker-compose.prod.yml" ] || [ -f "docker-compose.yml" ]; then
        COMPOSE_FILE="docker-compose.prod.yml"
        [ ! -f "$COMPOSE_FILE" ] && COMPOSE_FILE="docker-compose.yml"
        
        echo "   Archivo encontrado: $COMPOSE_FILE"
        
        docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U sigma -d sigma_db -F p > "${BACKUP_FILE}" 2>&1
        
        if [ -f "${BACKUP_FILE}" ] && [ -s "${BACKUP_FILE}" ]; then
            echo "   ✅ Backup creado: ${BACKUP_FILE}"
            gzip "${BACKUP_FILE}"
            echo "   ✅ Comprimido: ${BACKUP_FILE}.gz"
            echo ""
            echo "📋 Ubicación: ${BACKUP_FILE}.gz"
            echo "📋 Tamaño: $(du -h ${BACKUP_FILE}.gz | cut -f1)"
            exit 0
        fi
    fi
fi

# Método 2: Docker directo
echo ""
echo "2️⃣ Intentando con Docker directo..."
if command -v docker &> /dev/null; then
    CONTAINER=$(docker ps -a | grep postgres | grep -v grep | awk '{print $1}' | head -1)
    
    if [ -n "$CONTAINER" ]; then
        echo "   Contenedor encontrado: $CONTAINER"
        
        # Verificar si está corriendo
        if docker ps | grep -q "$CONTAINER"; then
            echo "   Contenedor está corriendo"
            docker exec "$CONTAINER" pg_dump -U sigma -d sigma_db -F p > "${BACKUP_FILE}" 2>&1
        else
            echo "   Contenedor detenido, iniciando temporalmente..."
            docker start "$CONTAINER"
            sleep 3
            docker exec "$CONTAINER" pg_dump -U sigma -d sigma_db -F p > "${BACKUP_FILE}" 2>&1
        fi
        
        if [ -f "${BACKUP_FILE}" ] && [ -s "${BACKUP_FILE}" ]; then
            echo "   ✅ Backup creado: ${BACKUP_FILE}"
            gzip "${BACKUP_FILE}"
            echo "   ✅ Comprimido: ${BACKUP_FILE}.gz"
            echo ""
            echo "📋 Ubicación: ${BACKUP_FILE}.gz"
            echo "📋 Tamaño: $(du -h ${BACKUP_FILE}.gz | cut -f1)"
            exit 0
        fi
    fi
fi

# Método 3: PostgreSQL directo
echo ""
echo "3️⃣ Intentando con PostgreSQL directo..."
if command -v pg_dump &> /dev/null; then
    # Intentar diferentes configuraciones
    for HOST in localhost 127.0.0.1; do
        for PORT in 5432 5433; do
            for USER in sigma postgres; do
                for DB in sigma_db postgres; do
                    echo "   Probando: $USER@$HOST:$PORT/$DB"
                    pg_dump -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -F p > "${BACKUP_FILE}" 2>&1
                    
                    if [ -f "${BACKUP_FILE}" ] && [ -s "${BACKUP_FILE}" ] && ! grep -q "error\|Error\|ERROR" "${BACKUP_FILE}"; then
                        echo "   ✅ Backup creado: ${BACKUP_FILE}"
                        gzip "${BACKUP_FILE}"
                        echo "   ✅ Comprimido: ${BACKUP_FILE}.gz"
                        echo ""
                        echo "📋 Ubicación: ${BACKUP_FILE}.gz"
                        echo "📋 Tamaño: $(du -h ${BACKUP_FILE}.gz | cut -f1)"
                        exit 0
                    fi
                done
            done
        done
    done
fi

# Método 4: Buscar volúmenes de Docker y copiar datos
echo ""
echo "4️⃣ Buscando volúmenes de Docker..."
if command -v docker &> /dev/null; then
    VOLUMES=$(docker volume ls | grep -E 'postgres|sigma' | awk '{print $2}')
    
    for VOL in $VOLUMES; do
        echo "   Volumen encontrado: $VOL"
        echo "   ⚠️  Nota: Copiar el volumen directamente no crea un backup SQL válido"
        echo "   Necesitas usar pg_dump para un backup funcional"
    done
fi

echo ""
echo "❌ No se pudo crear el backup automáticamente"
echo ""
echo "💡 COMANDOS MANUALES:"
echo ""
echo "Si tienes Docker Compose:"
echo "  cd /root/sigma"
echo "  docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U sigma -d sigma_db > /tmp/backup.sql"
echo "  gzip /tmp/backup.sql"
echo ""
echo "Si tienes Docker:"
echo "  docker ps -a | grep postgres  # Encuentra el contenedor"
echo "  docker exec <ID_CONTENEDOR> pg_dump -U sigma -d sigma_db > /tmp/backup.sql"
echo "  gzip /tmp/backup.sql"
echo ""
echo "Si tienes PostgreSQL instalado:"
echo "  pg_dump -h localhost -U sigma -d sigma_db > /tmp/backup.sql"
echo "  gzip /tmp/backup.sql"
echo ""

