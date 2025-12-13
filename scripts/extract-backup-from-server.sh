#!/bin/bash

# ===========================================
# Script para extraer backup desde servidor remoto
# ===========================================
# Este script puede ejecutarse directamente en el servidor
# o desde fuera usando SSH para extraer el backup de la BD

set -e

# Configuración
SERVER="${1:-root@64.23.225.99}"
REMOTE_DIR="${REMOTE_DIR:-/root/sigma}"
BACKUP_DIR="${BACKUP_DIR:-/root/sigma/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/sigma_emergency_backup_${TIMESTAMP}.sql"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚨 SIGMA ERP - Extracción de Backup de Emergencia${NC}"
echo "================================================"
echo "Servidor: ${SERVER}"
echo ""

# Función para ejecutar en el servidor
extract_backup_on_server() {
    echo -e "${BLUE}📦 Extrayendo backup en el servidor...${NC}"
    
    # Crear directorio de backups si no existe
    mkdir -p "${BACKUP_DIR}"
    
    # Método 1: Intentar con Docker (si está disponible)
    if command -v docker &> /dev/null && docker ps | grep -q postgres; then
        echo -e "${YELLOW}🐳 Detectado Docker, extrayendo desde contenedor...${NC}"
        
        # Obtener nombre del contenedor de postgres
        CONTAINER=$(docker ps | grep postgres | awk '{print $1}' | head -1)
        
        if [ -n "$CONTAINER" ]; then
            echo "   Contenedor: $CONTAINER"
            
            # Intentar obtener variables de entorno del contenedor
            DB_USER=$(docker exec $CONTAINER printenv POSTGRES_USER 2>/dev/null || echo "sigma")
            DB_NAME=$(docker exec $CONTAINER printenv POSTGRES_DB 2>/dev/null || echo "sigma_db")
            
            echo "   Usuario: $DB_USER"
            echo "   Base de datos: $DB_NAME"
            
            # Crear backup usando pg_dump dentro del contenedor
            docker exec $CONTAINER pg_dump -U "$DB_USER" -d "$DB_NAME" -F p > "${BACKUP_FILE}" 2>/dev/null
            
            if [ $? -eq 0 ] && [ -f "${BACKUP_FILE}" ] && [ -s "${BACKUP_FILE}" ]; then
                echo -e "${GREEN}✅ Backup creado exitosamente desde Docker${NC}"
                COMPRESSED_FILE="${BACKUP_FILE}.gz"
                gzip "${BACKUP_FILE}"
                echo -e "${GREEN}✅ Backup comprimido: ${COMPRESSED_FILE}${NC}"
                echo ""
                echo "📋 Ubicación del backup:"
                echo "   ${COMPRESSED_FILE}"
                echo ""
                echo "📥 Para descargarlo, ejecuta desde tu máquina local:"
                echo "   scp ${SERVER}:${COMPRESSED_FILE} ./backups/"
                return 0
            fi
        fi
    fi
    
    # Método 2: Intentar con docker-compose
    if command -v docker-compose &> /dev/null && [ -f "${REMOTE_DIR}/docker-compose.prod.yml" ]; then
        echo -e "${YELLOW}🐳 Intentando con docker-compose...${NC}"
        cd "${REMOTE_DIR}"
        
        docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U sigma -d sigma_db -F p > "${BACKUP_FILE}" 2>/dev/null
        
        if [ $? -eq 0 ] && [ -f "${BACKUP_FILE}" ] && [ -s "${BACKUP_FILE}" ]; then
            echo -e "${GREEN}✅ Backup creado exitosamente con docker-compose${NC}"
            COMPRESSED_FILE="${BACKUP_FILE}.gz"
            gzip "${BACKUP_FILE}"
            echo -e "${GREEN}✅ Backup comprimido: ${COMPRESSED_FILE}${NC}"
            echo ""
            echo "📋 Ubicación del backup:"
            echo "   ${COMPRESSED_FILE}"
            echo ""
            echo "📥 Para descargarlo, ejecuta desde tu máquina local:"
            echo "   scp ${SERVER}:${COMPRESSED_FILE} ./backups/"
            return 0
        fi
    fi
    
    # Método 3: Intentar con PostgreSQL directo (si está instalado)
    if command -v pg_dump &> /dev/null; then
        echo -e "${YELLOW}🗄️  Intentando con PostgreSQL directo...${NC}"
        
        # Intentar leer configuración desde .env si existe
        if [ -f "${REMOTE_DIR}/.env" ]; then
            source <(grep -v '^#' "${REMOTE_DIR}/.env" | grep -E '^(DB_|DATABASE_URL)' | sed 's/^/export /')
        fi
        
        DB_HOST=${DB_HOST:-localhost}
        DB_PORT=${DB_PORT:-5432}
        DB_USER=${DB_USER:-sigma}
        DB_NAME=${DB_NAME:-sigma_db}
        
        # Intentar con contraseña desde variable de entorno o sin contraseña
        if [ -n "$DB_PASSWORD" ]; then
            PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p > "${BACKUP_FILE}" 2>/dev/null
        else
            # Intentar sin contraseña (trust authentication)
            pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p > "${BACKUP_FILE}" 2>/dev/null
        fi
        
        if [ $? -eq 0 ] && [ -f "${BACKUP_FILE}" ] && [ -s "${BACKUP_FILE}" ]; then
            echo -e "${GREEN}✅ Backup creado exitosamente con pg_dump directo${NC}"
            COMPRESSED_FILE="${BACKUP_FILE}.gz"
            gzip "${BACKUP_FILE}"
            echo -e "${GREEN}✅ Backup comprimido: ${COMPRESSED_FILE}${NC}"
            echo ""
            echo "📋 Ubicación del backup:"
            echo "   ${COMPRESSED_FILE}"
            echo ""
            echo "📥 Para descargarlo, ejecuta desde tu máquina local:"
            echo "   scp ${SERVER}:${COMPRESSED_FILE} ./backups/"
            return 0
        fi
    fi
    
    # Método 4: Extraer directamente desde el volumen de Docker
    if command -v docker &> /dev/null; then
        echo -e "${YELLOW}💾 Intentando extraer desde volumen de Docker...${NC}"
        
        # Buscar volúmenes de postgres
        VOLUMES=$(docker volume ls | grep postgres | awk '{print $2}')
        
        for VOL in $VOLUMES; do
            echo "   Verificando volumen: $VOL"
            
            # Crear contenedor temporal para acceder al volumen
            TEMP_CONTAINER="temp_backup_$(date +%s)"
            
            # Intentar montar el volumen y buscar archivos de datos
            docker run --rm -v "$VOL:/data" alpine sh -c "
                if [ -d /data/base ]; then
                    echo 'Volumen de datos encontrado en: $VOL'
                    exit 0
                fi
                exit 1
            " 2>/dev/null
            
            if [ $? -eq 0 ]; then
                echo -e "${YELLOW}⚠️  Volumen encontrado, pero necesitas usar pg_dump para un backup válido${NC}"
                echo "   Intenta los métodos anteriores primero"
            fi
        done
    fi
    
    echo -e "${RED}❌ No se pudo extraer el backup automáticamente${NC}"
    echo ""
    echo "💡 Opciones manuales:"
    echo ""
    echo "1. Si tienes acceso a Docker:"
    echo "   docker exec <container_postgres> pg_dump -U sigma -d sigma_db > /tmp/backup.sql"
    echo ""
    echo "2. Si tienes acceso a docker-compose:"
    echo "   cd /root/sigma"
    echo "   docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U sigma -d sigma_db > backups/backup.sql"
    echo ""
    echo "3. Si tienes acceso directo a PostgreSQL:"
    echo "   pg_dump -h localhost -U sigma -d sigma_db > backups/backup.sql"
    echo ""
    return 1
}

# Verificar si se ejecuta localmente o remotamente
if [ "$1" = "--local" ] || [ "$(hostname)" != "$(echo $SERVER | cut -d'@' -f2 | cut -d':' -f1)" ]; then
    # Ejecutar remotamente vía SSH
    echo -e "${BLUE}📡 Conectando al servidor vía SSH...${NC}"
    
    # Verificar conexión
    if ! ssh -o ConnectTimeout=5 ${SERVER} "echo 'Conexión OK'" > /dev/null 2>&1; then
        echo -e "${RED}❌ Error: No se puede conectar al servidor ${SERVER}${NC}"
        echo ""
        echo "💡 Si el servidor está hackeado y solo tienes acceso por 'launch recovery':"
        echo "   1. Accede al servidor por recovery mode"
        echo "   2. Copia este script al servidor"
        echo "   3. Ejecuta: bash extract-backup-from-server.sh --local"
        exit 1
    fi
    
    # Subir script al servidor y ejecutarlo
    echo -e "${GREEN}✅ Conexión establecida${NC}"
    echo ""
    
    # Crear script temporal en el servidor
    ssh ${SERVER} "cat > /tmp/extract-backup.sh << 'SCRIPT_EOF'
$(cat "$0")
SCRIPT_EOF
chmod +x /tmp/extract-backup.sh
/tmp/extract-backup.sh --local
rm -f /tmp/extract-backup.sh"
    
    # Descargar el backup si se creó exitosamente
    echo ""
    echo -e "${BLUE}📥 Buscando backup para descargar...${NC}"
    LATEST_BACKUP=$(ssh ${SERVER} "ls -t ${BACKUP_DIR}/sigma_emergency_backup_*.sql.gz 2>/dev/null | head -1")
    
    if [ -n "$LATEST_BACKUP" ]; then
        echo "   Backup encontrado: $LATEST_BACKUP"
        mkdir -p ./backups
        scp "${SERVER}:${LATEST_BACKUP}" ./backups/
        echo -e "${GREEN}✅ Backup descargado a: ./backups/$(basename $LATEST_BACKUP)${NC}"
    fi
else
    # Ejecutar localmente en el servidor
    extract_backup_on_server
fi

