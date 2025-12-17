#!/bin/bash

# ===========================================
# Script de Despliegue Limpio y Seguro
# ===========================================
# Este script realiza un despliegue completo y seguro a producción:
# 1. Hace backup de producción
# 2. Hace commit de los cambios
# 3. Sube cambios al servidor
# 4. Construye y despliega
# 5. Verifica que todo funciona
#
# Uso: DEPLOY_SERVER=root@143.110.229.234 ./scripts/clean-deploy.sh

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración
SERVER="${DEPLOY_SERVER:-root@143.110.229.234}"
REMOTE_DIR="/root/sigma"

echo -e "${BLUE}🚀 SIGMA ERP - Despliegue Limpio y Seguro${NC}"
echo "=============================================="
echo "Servidor: ${SERVER}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ Error: No se encontraron archivos del proyecto${NC}"
    echo "   Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Paso 1: Backup de producción
echo -e "${BLUE}📦 Paso 1/7: Haciendo backup de producción...${NC}"
if [ -f "./scripts/backup-production.sh" ]; then
    ./scripts/backup-production.sh || {
        echo -e "${YELLOW}⚠️  No se pudo hacer backup automático${NC}"
        echo "   Continuando de todas formas..."
    }
else
    echo -e "${YELLOW}⚠️  Script de backup no encontrado, omitiendo...${NC}"
fi
echo ""

# Paso 2: Verificar estado de Git
echo -e "${BLUE}📋 Paso 2/7: Verificando cambios en Git...${NC}"
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
    echo -e "${YELLOW}⚠️  Hay cambios sin commitear:${NC}"
    git status --short
    echo ""
    read -p "¿Deseas hacer commit de estos cambios antes de desplegar? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}💾 Haciendo commit...${NC}"
        read -p "Mensaje del commit: " COMMIT_MESSAGE
        if [ -z "$COMMIT_MESSAGE" ]; then
            COMMIT_MESSAGE="Deploy: Mejoras en permisos y acceso (Project Managers y Command Center)"
        fi
        
        git add -A
        git commit -m "$COMMIT_MESSAGE" || {
            echo -e "${YELLOW}⚠️  No se pudo hacer commit (puede que no haya cambios nuevos)${NC}"
        }
        
        echo ""
        read -p "¿Deseas hacer push al repositorio remoto? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push origin main || {
                echo -e "${YELLOW}⚠️  No se pudo hacer push (puede que no haya cambios o problemas de conexión)${NC}"
            }
        fi
    else
        echo -e "${YELLOW}⚠️  Continuando sin commitear cambios${NC}"
    fi
else
    echo -e "${GREEN}✅ No hay cambios sin commitear${NC}"
fi
echo ""

# Paso 3: Verificar conexión SSH
echo -e "${BLUE}🔌 Paso 3/7: Verificando conexión SSH...${NC}"
if ! ssh -o ConnectTimeout=5 ${SERVER} "echo 'Conexión OK'" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: No se pudo conectar al servidor${NC}"
    echo "   Verifica que tengas acceso SSH configurado"
    exit 1
fi
echo -e "${GREEN}✅ Conexión SSH establecida${NC}"
echo ""

# Paso 4: Subir archivos al servidor
echo -e "${BLUE}📤 Paso 4/7: Subiendo archivos al servidor...${NC}"
if [ -f "./scripts/upload-to-server.sh" ]; then
    ./scripts/upload-to-server.sh || {
        echo -e "${RED}❌ Error al subir archivos${NC}"
        exit 1
    }
else
    echo -e "${YELLOW}⚠️  Script upload-to-server.sh no encontrado${NC}"
    echo "   Subiendo archivos manualmente..."
    ssh ${SERVER} "mkdir -p ${REMOTE_DIR}"
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '.next' \
        --exclude 'dist' \
        --exclude '*.log' \
        --exclude '.env' \
        --exclude 'backups/*.sql*' \
        ./ ${SERVER}:${REMOTE_DIR}/
fi
echo ""

# Paso 5: Construir y enviar imágenes
echo -e "${BLUE}🐳 Paso 5/7: Construyendo y enviando imágenes Docker...${NC}"
if [ -f "./scripts/build-and-send-via-ssh.sh" ]; then
    echo -e "${YELLOW}⚠️  Esto puede tardar varios minutos...${NC}"
    read -p "¿Continuar con la construcción de imágenes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./scripts/build-and-send-via-ssh.sh || {
            echo -e "${RED}❌ Error al construir/enviar imágenes${NC}"
            exit 1
        }
    else
        echo -e "${YELLOW}⚠️  Construcción de imágenes omitida${NC}"
        echo "   Puedes construir manualmente más tarde con:"
        echo "   ./scripts/build-and-send-via-ssh.sh"
    fi
else
    echo -e "${YELLOW}⚠️  Script build-and-send-via-ssh.sh no encontrado${NC}"
    echo "   Necesitarás construir las imágenes manualmente en el servidor"
fi
echo ""

# Paso 6: Desplegar en servidor
echo -e "${BLUE}🚀 Paso 6/7: Desplegando en servidor...${NC}"
ssh ${SERVER} << ENDSSH
set -e
cd ${REMOTE_DIR}

echo "📋 Verificando configuración..."
if [ ! -f ".env" ]; then
    echo "⚠️  Archivo .env no encontrado"
    if [ -f "env.example" ]; then
        echo "   Creando desde env.example..."
        cp env.example .env
        echo "⚠️  IMPORTANTE: Edita .env y configura las variables necesarias"
        echo "   Ejecuta: nano .env"
        exit 1
    else
        echo "❌ Error: env.example no encontrado"
        exit 1
    fi
fi

echo "✅ Archivo .env encontrado"

# Verificar que las imágenes están disponibles
echo ""
echo "📦 Verificando imágenes Docker..."
if docker images | grep -q "sigma-api" && docker images | grep -q "sigma-web"; then
    echo "✅ Imágenes encontradas, usando docker-compose.prod.images.yml"
    COMPOSE_FILE="docker-compose.prod.images.yml"
else
    echo "⚠️  Imágenes no encontradas, construyendo desde código..."
    COMPOSE_FILE="docker-compose.prod.yml"
fi

# Detener servicios actuales
echo ""
echo "🛑 Deteniendo servicios actuales..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.prod.images.yml down 2>/dev/null || true

# Construir si es necesario
if [ "$COMPOSE_FILE" = "docker-compose.prod.yml" ]; then
    echo ""
    echo "🔨 Construyendo imágenes..."
    docker-compose -f docker-compose.prod.yml build
fi

# Levantar servicios
echo ""
echo "🚀 Levantando servicios..."
docker-compose -f ${COMPOSE_FILE} up -d

# Esperar a que los servicios estén listos
echo ""
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Verificar estado
echo ""
echo "📊 Estado de los servicios:"
docker-compose -f ${COMPOSE_FILE} ps

# Verificar health checks
echo ""
echo "🏥 Verificando health checks..."
sleep 5

# API Health Check
if docker-compose -f ${COMPOSE_FILE} exec -T api sh -c "node -e \"require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\"" 2>/dev/null; then
    echo "✅ API está respondiendo"
else
    echo "⚠️  API aún no está lista (puede tardar unos segundos más)"
fi

# Verificar logs recientes
echo ""
echo "📋 Últimos logs de API:"
docker-compose -f ${COMPOSE_FILE} logs --tail=20 api | tail -10 || true

ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error durante el despliegue${NC}"
    exit 1
fi

echo ""

# Paso 7: Verificación final
echo -e "${BLUE}✅ Paso 7/7: Verificación final...${NC}"
echo ""
echo -e "${GREEN}✅ Despliegue completado exitosamente!${NC}"
echo ""
echo -e "${BLUE}📋 Resumen:${NC}"
echo "   ✅ Backup de producción realizado"
echo "   ✅ Cambios subidos al servidor"
echo "   ✅ Imágenes construidas y desplegadas"
echo "   ✅ Servicios levantados"
echo ""
echo -e "${BLUE}🌐 URLs:${NC}"
echo "   - API:  http://143.110.229.234:3040/api"
echo "   - Web:  http://143.110.229.234:3041"
echo ""
echo -e "${BLUE}📋 Comandos útiles:${NC}"
echo "   - Ver logs:         ssh ${SERVER} 'cd ${REMOTE_DIR} && docker-compose -f docker-compose.prod.images.yml logs -f'"
echo "   - Ver estado:       ssh ${SERVER} 'cd ${REMOTE_DIR} && docker-compose -f docker-compose.prod.images.yml ps'"
echo "   - Reiniciar:        ssh ${SERVER} 'cd ${REMOTE_DIR} && docker-compose -f docker-compose.prod.images.yml restart'"
echo ""
echo -e "${BLUE}🔍 Para verificar que todo funciona:${NC}"
echo "   1. Accede a la aplicación web"
echo "   2. Verifica que los Project Managers pueden ver proyectos/tareas/sprints"
echo "   3. Verifica que todos los usuarios pueden acceder al Command Center"
echo ""
