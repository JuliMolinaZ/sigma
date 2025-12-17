#!/bin/bash

# ===========================================
# Script para hacer backup de la base de datos de producción
# ===========================================
# Este script puede ejecutarse:
# 1. Directamente en el servidor de producción
# 2. Desde local, conectándose vía SSH al servidor
#
# Uso:
#   Desde local: DEPLOY_SERVER=root@example.com ./scripts/backup-production.sh
#   En servidor: ./scripts/backup-production.sh

set -e

# Configuración
SERVER="${DEPLOY_SERVER:-}"
REMOTE_DIR="/root/sigma"
LOCAL_BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="sigma_production_backup_${TIMESTAMP}.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗄️  SIGMA ERP - Backup de Base de Datos de Producción${NC}"
echo "=================================================="
echo ""

# Función para hacer backup directamente en el servidor
backup_on_server() {
    local backup_path="${1}"
    
    echo -e "${BLUE}📦 Creando backup en el servidor...${NC}"
    
    # Cargar variables de entorno si existe .env
    if [ -f "${REMOTE_DIR}/.env" ]; then
        echo "📄 Cargando variables desde .env..."
        cd "${REMOTE_DIR}"
        export $(grep -v '^#' .env | grep -v '^$' | xargs)
    fi
    
    # Intentar con docker-compose primero
    if command -v docker-compose &> /dev/null; then
        cd "${REMOTE_DIR}"
        
        # Buscar archivo docker-compose
        COMPOSE_FILE=""
        if [ -f "docker-compose.prod.yml" ]; then
            COMPOSE_FILE="docker-compose.prod.yml"
        elif [ -f "docker-compose.yml" ]; then
            COMPOSE_FILE="docker-compose.yml"
        fi
        
        if [ -n "$COMPOSE_FILE" ]; then
            echo "   Usando: $COMPOSE_FILE"
            
            # Verificar que el contenedor está corriendo
            if docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
                echo "   ✅ Contenedor PostgreSQL está corriendo"
                
                # Hacer backup
                docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
                    -U "${DB_USER:-sigma}" \
                    -d "${DB_NAME:-sigma_db}" \
                    -F p > "${backup_path}" 2>&1
                
                if [ $? -eq 0 ] && [ -f "${backup_path}" ] && [ -s "${backup_path}" ]; then
                    echo -e "   ${GREEN}✅ Backup creado exitosamente${NC}"
                    return 0
                else
                    echo -e "   ${RED}❌ Error al crear backup con docker-compose${NC}"
                fi
            else
                echo -e "   ${YELLOW}⚠️  Contenedor PostgreSQL no está corriendo${NC}"
            fi
        fi
    fi
    
    # Intentar con docker directamente
    if command -v docker &> /dev/null; then
        CONTAINER=$(docker ps -a | grep postgres | grep -v grep | awk '{print $1}' | head -1)
        
        if [ -n "$CONTAINER" ]; then
            echo "   Intentando con Docker directo (contenedor: $CONTAINER)..."
            
            # Verificar si está corriendo
            if docker ps | grep -q "$CONTAINER"; then
                docker exec "$CONTAINER" pg_dump \
                    -U "${DB_USER:-sigma}" \
                    -d "${DB_NAME:-sigma_db}" \
                    -F p > "${backup_path}" 2>&1
            else
                echo "   Iniciando contenedor temporalmente..."
                docker start "$CONTAINER"
                sleep 3
                docker exec "$CONTAINER" pg_dump \
                    -U "${DB_USER:-sigma}" \
                    -d "${DB_NAME:-sigma_db}" \
                    -F p > "${backup_path}" 2>&1
            fi
            
            if [ $? -eq 0 ] && [ -f "${backup_path}" ] && [ -s "${backup_path}" ]; then
                echo -e "   ${GREEN}✅ Backup creado exitosamente${NC}"
                return 0
            fi
        fi
    fi
    
    # Intentar con pg_dump directo (si PostgreSQL está instalado)
    if command -v pg_dump &> /dev/null; then
        echo "   Intentando con pg_dump directo..."
        
        # Intentar diferentes configuraciones
        for HOST in localhost 127.0.0.1; do
            for PORT in 5432 5433; do
                for USER in sigma postgres; do
                    for DB in sigma_db postgres; do
                        if PGPASSWORD="${DB_PASSWORD}" pg_dump -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -F p > "${backup_path}" 2>&1; then
                            if [ -f "${backup_path}" ] && [ -s "${backup_path}" ] && ! grep -q "error\|Error\|ERROR\|FATAL" "${backup_path}"; then
                                echo -e "   ${GREEN}✅ Backup creado exitosamente${NC}"
                                return 0
                            fi
                        fi
                    done
                done
            done
        done
    fi
    
    return 1
}

# Detectar si estamos en el servidor
IS_ON_SERVER=false
if [ -z "$SERVER" ]; then
    # Verificar si estamos realmente en el servidor
    if [ -d "${REMOTE_DIR}" ] && [ -f "${REMOTE_DIR}/docker-compose.prod.yml" ] || [ -f "${REMOTE_DIR}/docker-compose.yml" ]; then
        IS_ON_SERVER=true
    elif [ "$(whoami)" = "root" ] && [ -d "/root/sigma" ]; then
        IS_ON_SERVER=true
    fi
fi

# Verificar si estamos en el servidor o necesitamos SSH
if [ -z "$SERVER" ] && [ "$IS_ON_SERVER" = true ]; then
    # Ejecutando directamente en el servidor
    echo -e "${BLUE}📍 Modo: Ejecución directa en servidor${NC}"
    echo ""
    
    BACKUP_DIR="${REMOTE_DIR}/backups"
    mkdir -p "${BACKUP_DIR}"
    BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"
    
    if backup_on_server "${BACKUP_PATH}"; then
        # Comprimir backup
        echo ""
        echo -e "${BLUE}📦 Comprimiendo backup...${NC}"
        gzip "${BACKUP_PATH}"
        
        BACKUP_SIZE=$(du -h "${BACKUP_PATH}.gz" | cut -f1)
        
        echo ""
        echo -e "${GREEN}✅ Backup de producción completado exitosamente${NC}"
        echo ""
        echo "📋 Detalles:"
        echo "   Archivo: ${BACKUP_PATH}.gz"
        echo "   Tamaño: ${BACKUP_SIZE}"
        echo ""
        echo "💡 Para descargar el backup, ejecuta desde tu máquina local:"
        echo "   scp ${SERVER:-$(hostname)}:${BACKUP_PATH}.gz ${LOCAL_BACKUP_DIR}/"
    else
        echo ""
        echo -e "${RED}❌ Error: No se pudo crear el backup${NC}"
        echo ""
        echo "💡 Comandos manuales:"
        echo ""
        echo "Con docker-compose:"
        echo "  cd ${REMOTE_DIR}"
        echo "  docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U sigma -d sigma_db > ${BACKUP_PATH}"
        echo "  gzip ${BACKUP_PATH}"
        echo ""
        exit 1
    fi
elif [ -n "$SERVER" ] || [ "$IS_ON_SERVER" = false ]; then
    # Ejecutando desde local, conectarse vía SSH
    if [ -z "$SERVER" ]; then
        echo -e "${YELLOW}⚠️  No se detectó ejecución en servidor${NC}"
        echo ""
        echo "Por favor, proporciona la información del servidor de producción:"
        echo ""
        echo "Ejemplos:"
        echo "  - root@sigma.runsolutions-services.com"
        echo "  - root@192.168.1.100"
        echo "  - usuario@servidor.com"
        echo ""
        read -p "Servidor SSH (usuario@host): " SERVER
        echo ""
        
        if [ -z "$SERVER" ]; then
            echo -e "${RED}❌ Error: Se requiere la información del servidor${NC}"
            echo ""
            echo "Uso:"
            echo "  DEPLOY_SERVER=root@example.com ./scripts/backup-production.sh"
            echo ""
            echo "O ejecuta el script y proporciona la información cuando se solicite."
            exit 1
        fi
    fi
    echo -e "${BLUE}📍 Modo: Conexión remota vía SSH${NC}"
    echo "   Servidor: ${SERVER}"
    echo ""
    
    # Crear directorio local de backups
    mkdir -p "${LOCAL_BACKUP_DIR}"
    
    # Crear backup en el servidor y descargarlo
    echo -e "${BLUE}🔌 Conectando al servidor...${NC}"
    
    ssh "${SERVER}" bash << ENDSSH
set -e
cd ${REMOTE_DIR}

# Crear directorio de backups
mkdir -p backups

# Función de backup
$(declare -f backup_on_server)

# Ejecutar backup
if backup_on_server "backups/${BACKUP_FILE}"; then
    # Comprimir
    gzip "backups/${BACKUP_FILE}"
    echo "BACKUP_SUCCESS:backups/${BACKUP_FILE}.gz"
else
    echo "BACKUP_ERROR"
    exit 1
fi
ENDSSH
    
    if [ $? -eq 0 ]; then
        # Descargar backup
        echo ""
        echo -e "${BLUE}📥 Descargando backup desde el servidor...${NC}"
        
        REMOTE_BACKUP_PATH="${REMOTE_DIR}/backups/${BACKUP_FILE_GZ}"
        LOCAL_BACKUP_PATH="${LOCAL_BACKUP_DIR}/${BACKUP_FILE_GZ}"
        
        scp "${SERVER}:${REMOTE_BACKUP_PATH}" "${LOCAL_BACKUP_PATH}"
        
        if [ $? -eq 0 ] && [ -f "${LOCAL_BACKUP_PATH}" ]; then
            BACKUP_SIZE=$(du -h "${LOCAL_BACKUP_PATH}" | cut -f1)
            
            echo ""
            echo -e "${GREEN}✅ Backup de producción completado exitosamente${NC}"
            echo ""
            echo "📋 Detalles:"
            echo "   Archivo local: ${LOCAL_BACKUP_PATH}"
            echo "   Tamaño: ${BACKUP_SIZE}"
            echo ""
            echo "💡 Para restaurar el backup:"
            echo "   scripts/restore-database.sh ${LOCAL_BACKUP_PATH}"
            
            # Opcional: Limpiar backup del servidor (comentado por seguridad)
            # echo ""
            # echo "🧹 Limpiando backup del servidor..."
            # ssh "${SERVER}" "rm -f ${REMOTE_BACKUP_PATH}"
        else
            echo ""
            echo -e "${RED}❌ Error al descargar el backup${NC}"
            exit 1
        fi
    else
        echo ""
        echo -e "${RED}❌ Error al crear backup en el servidor${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✨ Proceso completado${NC}"
