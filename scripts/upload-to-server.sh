#!/bin/bash

# Script para subir archivos al servidor de producción
# Configura el servidor usando la variable de entorno DEPLOY_SERVER
# Ejemplo: DEPLOY_SERVER=root@example.com ./scripts/upload-to-server.sh

set -e

SERVER="${DEPLOY_SERVER:-root@example.com}"
REMOTE_DIR="/root/sigma"
LOCAL_DIR="."

echo "📤 Subiendo archivos a ${SERVER}..."
echo "   Directorio remoto: ${REMOTE_DIR}"
echo ""

# Verificar conexión SSH
echo "🔌 Verificando conexión SSH..."
ssh -o ConnectTimeout=5 ${SERVER} "echo 'Conexión OK'" || {
    echo "❌ Error: No se pudo conectar al servidor"
    echo "   Verifica que tengas acceso SSH configurado"
    exit 1
}

# Crear directorio remoto si no existe
echo "📁 Creando directorio remoto..."
ssh ${SERVER} "mkdir -p ${REMOTE_DIR}/backups ${REMOTE_DIR}/scripts"

# Subir archivos usando rsync (excluye node_modules, .git, etc.)
echo "📦 Sincronizando archivos..."
echo "   ✅ Incluye: Código fuente, Dockerfiles, configuración, scripts"
echo "   ❌ Excluye: node_modules, builds, backups, .env, .git"
echo ""

rsync -avz \
    --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next' \
    --exclude 'dist' \
    --exclude '*.log' \
    --exclude '.env' \
    --exclude 'backups/*.sql*' \
    --exclude 'docs/*.sql*' \
    --exclude 'apps/*/node_modules' \
    --exclude 'packages/*/node_modules' \
    --exclude 'apps/*/dist' \
    --exclude 'apps/web/.next' \
    --exclude 'apps/api/dist' \
    --exclude '*.tsbuildinfo' \
    ${LOCAL_DIR}/ ${SERVER}:${REMOTE_DIR}/

echo ""
echo "✅ Archivos subidos exitosamente!"
echo ""
echo "📋 Próximos pasos en el servidor:"
echo "   ssh ${SERVER}"
echo "   cd ${REMOTE_DIR}"
echo "   cp env.example .env"
echo "   nano .env  # Configurar variables"
echo "   ./scripts/quick-deploy.sh"
echo ""

