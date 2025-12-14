#!/bin/bash

# Script para build local y envío de imágenes Docker por SSH
# Uso: ./scripts/build-and-send-via-ssh.sh [servidor] [usuario]
# Ejemplo: DEPLOY_SERVER=root@example.com ./scripts/build-and-send-via-ssh.sh
# O: ./scripts/build-and-send-via-ssh.sh root@example.com

# No usar set -e aquí porque queremos manejar errores manualmente en el loop de build

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración
SERVER=${1:-"${DEPLOY_SERVER:-root@example.com}"}
REMOTE_DIR=${2:-"/root/sigma"}
VERSION=$(node -p "require('./package.json').version")

echo "🐳 SIGMA ERP - Build Local y Envío por SSH"
echo "============================================"
echo "Servidor: ${SERVER}"
echo "Versión: ${VERSION}"
echo ""

# Verificar que Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker no está corriendo${NC}"
    exit 1
fi

# Configurar buildx para multi-arch si no existe
echo -e "${BLUE}🔧 Configurando Docker Buildx para linux/amd64...${NC}"
if ! docker buildx ls | grep -q "default"; then
    docker buildx create --name default --use 2>/dev/null || true
fi
# Asegurar que buildx esté usando el builder correcto
docker buildx use default 2>/dev/null || docker buildx inspect --bootstrap 2>/dev/null || true

# Verificar conexión SSH
echo -e "${BLUE}🔌 Verificando conexión SSH...${NC}"
if ! ssh -o ConnectTimeout=5 ${SERVER} "echo 'Conexión OK'" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: No se pudo conectar al servidor${NC}"
    echo "   Verifica que tengas acceso SSH configurado"
    exit 1
fi
echo -e "${GREEN}✅ Conexión SSH establecida${NC}"

# Paso 1: Build local
echo ""
echo -e "${BLUE}📦 Paso 1/5: Construyendo imágenes Docker localmente...${NC}"
echo -e "${YELLOW}   Nota: Esto puede tardar varios minutos${NC}"
echo -e "${YELLOW}   Los Dockerfiles incluyen retry automático para errores de red${NC}"
echo ""

# Intentar build con retry
MAX_BUILD_ATTEMPTS=3
BUILD_ATTEMPT=1
BUILD_SUCCESS=false

while [ $BUILD_ATTEMPT -le $MAX_BUILD_ATTEMPTS ] && [ "$BUILD_SUCCESS" = false ]; do
    echo -e "${BLUE}   Intento de build ${BUILD_ATTEMPT}/${MAX_BUILD_ATTEMPTS}...${NC}"
    echo -e "${YELLOW}   (Esto puede tardar varios minutos, mostrando progreso en tiempo real...)${NC}"
    echo ""
    
    # Limpiar log anterior
    > /tmp/docker-build.log
    
    # Ejecutar build mostrando output en tiempo real Y guardando en log
    # Usar tee para mostrar y guardar simultáneamente
    # Usar unbuffered output para ver progreso inmediato
    echo -e "${BLUE}   Iniciando build de Docker...${NC}"
    
    # Desactivar exit on error temporalmente para capturar exit code manualmente
    set +e
    # Usar docker compose (nuevo) o docker-compose (legacy) según esté disponible
    # IMPORTANTE: Construir para linux/amd64 (servidor) aunque estemos en Mac ARM64
    # Usar DOCKER_DEFAULT_PLATFORM y COMPOSE_DOCKER_CLI_BUILD para habilitar buildx
    # El flag --progress debe ir antes del comando build
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    export DOCKER_DEFAULT_PLATFORM=linux/amd64
    if command -v docker &> /dev/null && docker compose version &> /dev/null 2>/dev/null; then
        docker compose --progress=plain -f docker-compose.prod.yml build --no-cache 2>&1 | tee /tmp/docker-build.log
    else
        # docker-compose (legacy) no soporta --progress como flag global, usarlo después de build
        docker-compose -f docker-compose.prod.yml build --no-cache 2>&1 | tee /tmp/docker-build.log
    fi
    BUILD_EXIT_CODE=${PIPESTATUS[0]}
    set +e  # Mantener desactivado para el resto del script (manejamos errores manualmente)
    
    echo ""  # Línea en blanco después del build
    
    # Verificar si es un error de configuración (no tiene sentido reintentar)
    if [ -f /tmp/docker-build.log ] && grep -q "ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND\|Error parsing attribute\|schema validation\|failed to solve" /tmp/docker-build.log; then
        echo -e "${RED}❌ Error de configuración detectado - deteniendo reintentos${NC}"
        echo -e "${YELLOW}   Últimos logs del error:${NC}"
        tail -40 /tmp/docker-build.log | grep -A 10 -B 5 "ERROR\|Error\|ERR" || tail -20 /tmp/docker-build.log
        echo ""
        echo -e "${YELLOW}💡 Este tipo de error no se soluciona con reintentos${NC}"
        echo "   Corrige el problema en el código y vuelve a intentar"
        exit 1
    fi
    
    if [ $BUILD_EXIT_CODE -eq 0 ]; then
        # Verificar que las imágenes se crearon realmente
        if docker images | grep -q "sigma-api" && docker images | grep -q "sigma-web"; then
            BUILD_SUCCESS=true
            echo -e "${GREEN}✅ Build completado exitosamente${NC}"
        else
            echo -e "${YELLOW}⚠️  Build reportó éxito pero las imágenes no se encontraron${NC}"
            if [ $BUILD_ATTEMPT -lt $MAX_BUILD_ATTEMPTS ]; then
                echo -e "${YELLOW}   Reintentando en 10 segundos...${NC}"
                sleep 10
                BUILD_ATTEMPT=$((BUILD_ATTEMPT + 1))
            else
                echo -e "${RED}❌ Build falló después de ${MAX_BUILD_ATTEMPTS} intentos${NC}"
                echo -e "${YELLOW}   Últimos logs del error:${NC}"
                tail -40 /tmp/docker-build.log
                exit 1
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  Build falló (exit code: ${BUILD_EXIT_CODE})${NC}"
        echo -e "${YELLOW}   Últimos logs del error:${NC}"
        if [ -f /tmp/docker-build.log ]; then
            tail -40 /tmp/docker-build.log | grep -A 10 -B 5 "ERROR\|Error\|ERR\|failed" || tail -20 /tmp/docker-build.log
        fi
        
        if [ $BUILD_ATTEMPT -lt $MAX_BUILD_ATTEMPTS ]; then
            echo -e "${YELLOW}   Reintentando en 10 segundos...${NC}"
            sleep 10
            BUILD_ATTEMPT=$((BUILD_ATTEMPT + 1))
        else
            echo -e "${RED}❌ Build falló después de ${MAX_BUILD_ATTEMPTS} intentos${NC}"
            echo ""
            echo -e "${YELLOW}💡 Sugerencias:${NC}"
            echo "   1. Verifica tu conexión a internet"
            echo "   2. Intenta más tarde (puede ser un problema temporal)"
            echo "   3. Verifica logs completos: cat /tmp/docker-build.log"
            echo "   4. Usa build con cache: docker-compose -f docker-compose.prod.yml build"
            exit 1
        fi
    fi
done

# Verificar que las imágenes se construyeron
if ! docker images | grep -q "sigma-api"; then
    echo -e "${RED}❌ Error: No se encontró la imagen sigma-api${NC}"
    exit 1
fi

if ! docker images | grep -q "sigma-web"; then
    echo -e "${RED}❌ Error: No se encontró la imagen sigma-web${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Imágenes construidas exitosamente${NC}"

# Paso 2: Guardar imágenes como archivos tar
echo ""
echo -e "${BLUE}💾 Paso 2/5: Guardando imágenes como archivos...${NC}"
TEMP_DIR=$(mktemp -d)
API_IMAGE_FILE="${TEMP_DIR}/sigma-api-${VERSION}.tar"
WEB_IMAGE_FILE="${TEMP_DIR}/sigma-web-${VERSION}.tar"

echo "   Guardando sigma-api..."
docker save sigma-api:latest -o "${API_IMAGE_FILE}"
echo "   Guardando sigma-web..."
docker save sigma-web:latest -o "${WEB_IMAGE_FILE}"

# Obtener tamaños
API_SIZE=$(du -h "${API_IMAGE_FILE}" | cut -f1)
WEB_SIZE=$(du -h "${WEB_IMAGE_FILE}" | cut -f1)

echo -e "${GREEN}✅ Imágenes guardadas:${NC}"
echo "   - sigma-api: ${API_SIZE}"
echo "   - sigma-web: ${WEB_SIZE}"

# Paso 3: Subir archivos al servidor
echo ""
echo -e "${BLUE}📤 Paso 3/5: Subiendo imágenes al servidor...${NC}"
echo "   Esto puede tardar varios minutos dependiendo del tamaño y conexión..."

# Crear directorio de imágenes en servidor
ssh ${SERVER} "mkdir -p ${REMOTE_DIR}/docker-images"

# Subir archivos
echo "   Subiendo sigma-api..."
scp "${API_IMAGE_FILE}" ${SERVER}:${REMOTE_DIR}/docker-images/
echo "   Subiendo sigma-web..."
scp "${WEB_IMAGE_FILE}" ${SERVER}:${REMOTE_DIR}/docker-images/

# Subir docker-compose.prod.yml y docker-compose.prod.images.yml
echo "   Subiendo docker-compose.prod.yml..."
scp docker-compose.prod.yml ${SERVER}:${REMOTE_DIR}/
echo "   Subiendo docker-compose.prod.images.yml..."
scp docker-compose.prod.images.yml ${SERVER}:${REMOTE_DIR}/

# Subir archivos de configuración de dominio (si existen)
if [ -f "nginx/sigma.runsolutions-services.com.conf" ]; then
    echo "   Subiendo configuración de Nginx..."
    ssh ${SERVER} "mkdir -p ${REMOTE_DIR}/nginx"
    scp nginx/sigma.runsolutions-services.com.conf ${SERVER}:${REMOTE_DIR}/nginx/
fi

if [ -f "scripts/setup-domain.sh" ]; then
    echo "   Subiendo script de configuración de dominio..."
    ssh ${SERVER} "mkdir -p ${REMOTE_DIR}/scripts && chmod +x ${REMOTE_DIR}/scripts/setup-domain.sh" 2>/dev/null || true
    scp scripts/setup-domain.sh ${SERVER}:${REMOTE_DIR}/scripts/
    ssh ${SERVER} "chmod +x ${REMOTE_DIR}/scripts/setup-domain.sh"
fi

echo -e "${GREEN}✅ Imágenes y configuración subidas exitosamente${NC}"

# Paso 4: Cargar imágenes en el servidor
echo ""
echo -e "${BLUE}📥 Paso 4/5: Cargando imágenes en el servidor...${NC}"
ssh ${SERVER} << ENDSSH
cd ${REMOTE_DIR}/docker-images

echo "   Cargando sigma-api..."
docker load -i sigma-api-${VERSION}.tar || echo "⚠️  sigma-api ya cargada o error"
echo "   Cargando sigma-web..."
docker load -i sigma-web-${VERSION}.tar || echo "⚠️  sigma-web ya cargada o error"

# Tag como latest (asegurar que tengan el tag correcto)
docker tag sigma-api:latest sigma-api:latest 2>/dev/null || true
docker tag sigma-web:latest sigma-web:latest 2>/dev/null || true

# Verificar que las imágenes están cargadas
echo ""
echo "📋 Imágenes Docker disponibles:"
docker images | grep -E "sigma-api|sigma-web" || echo "⚠️  No se encontraron imágenes sigma"

echo ""
echo "✅ Imágenes cargadas en el servidor"
ENDSSH

# Paso 5: Deploy en servidor
echo ""
read -p "¿Deseas desplegar ahora en el servidor? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🚀 Paso 5/5: Desplegando en servidor...${NC}"
    ssh ${SERVER} << ENDSSH
cd ${REMOTE_DIR}

# Detener servicios actuales
docker-compose -f docker-compose.prod.images.yml down || true

# Levantar servicios usando imágenes locales
docker-compose -f docker-compose.prod.images.yml up -d

# Verificar estado
sleep 3
docker-compose -f docker-compose.prod.images.yml ps
ENDSSH
    echo -e "${GREEN}✅ Despliegue completado${NC}"
else
    echo -e "${YELLOW}⚠️  Despliegue omitido${NC}"
    echo "   Para desplegar manualmente, ejecuta en el servidor:"
    echo "   ssh ${SERVER}"
    echo "   cd ${REMOTE_DIR}"
    echo "   docker-compose -f docker-compose.prod.images.yml up -d"
fi

# Limpiar archivos temporales locales
echo ""
echo -e "${BLUE}🧹 Limpiando archivos temporales locales...${NC}"
rm -rf "${TEMP_DIR}"
echo -e "${GREEN}✅ Limpieza completada${NC}"

# Resumen
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Proceso completado exitosamente!${NC}"
echo ""
echo -e "${BLUE}📋 Resumen:${NC}"
echo "   - Imágenes construidas localmente"
echo "   - Imágenes enviadas al servidor"
echo "   - Imágenes cargadas en Docker del servidor"
echo ""
echo -e "${BLUE}📝 Archivos en servidor:${NC}"
echo "   - ${REMOTE_DIR}/docker-images/sigma-api-${VERSION}.tar"
echo "   - ${REMOTE_DIR}/docker-images/sigma-web-${VERSION}.tar"
echo ""
echo -e "${BLUE}🔄 Para desplegar:${NC}"
echo "   ssh ${SERVER}"
echo "   cd ${REMOTE_DIR}"
echo "   docker-compose -f docker-compose.prod.images.yml up -d"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
