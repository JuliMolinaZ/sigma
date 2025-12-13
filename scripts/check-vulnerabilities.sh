#!/bin/bash

# Script para verificar vulnerabilidades de React/Next.js
# Fecha: 12 de Diciembre de 2025

set -e

echo "🔍 SIGMA ERP - Verificación de Vulnerabilidades"
echo "================================================"
echo "Fecha: $(date)"
echo ""

cd "$(dirname "$0")/../apps/web" || exit 1

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📦 Verificando versiones instaladas...${NC}"
echo ""

# Verificar Next.js
NEXT_VERSION=$(pnpm list next --depth=0 2>/dev/null | grep "next@" | awk '{print $2}' | sed 's/@//' | sed 's/^next//' || echo "no encontrado")
echo "Next.js: ${NEXT_VERSION}"

# Verificar React
REACT_VERSION=$(pnpm list react --depth=0 2>/dev/null | grep "react@" | awk '{print $2}' | sed 's/@//' | sed 's/^react//' || echo "no encontrado")
echo "React: ${REACT_VERSION}"

# Verificar React DOM
REACT_DOM_VERSION=$(pnpm list react-dom --depth=0 2>/dev/null | grep "react-dom@" | awk '{print $2}' | sed 's/@//' | sed 's/^react-dom//' || echo "no encontrado")
echo "React DOM: ${REACT_DOM_VERSION}"

echo ""
echo -e "${BLUE}🌐 Verificando versiones más recientes disponibles...${NC}"
echo ""

# Obtener última versión de Next.js
LATEST_NEXT=$(pnpm view next version 2>/dev/null || echo "error")
echo "Última versión Next.js: ${LATEST_NEXT}"

# Obtener última versión de React
LATEST_REACT=$(pnpm view react version 2>/dev/null || echo "error")
echo "Última versión React: ${LATEST_REACT}"

echo ""
echo -e "${BLUE}🔍 Verificando dependencias de react-server-dom...${NC}"
echo ""

# Verificar react-server-dom (puede estar como dependencia de Next.js)
pnpm list | grep -i "react-server" || echo "No encontrado (puede estar como dependencia interna de Next.js)"

echo ""
echo -e "${BLUE}📊 Análisis de Vulnerabilidades:${NC}"
echo ""

# Verificar Next.js (Actualizado 13 Dic 2025 - CVE-2025-67779, CVE-2025-55183)
if [[ "$NEXT_VERSION" == *"16.0"* ]]; then
    # Extraer número de versión
    NEXT_NUM=$(echo "$NEXT_VERSION" | sed 's/16.0.//' | sed 's/[^0-9].*//')
    if [ -n "$NEXT_NUM" ] && [ "$NEXT_NUM" -lt 10 ]; then
        echo -e "${RED}❌ Next.js ${NEXT_VERSION} es VULNERABLE (necesita >= 16.0.10)${NC}"
        echo -e "${RED}   ⚠️  Vulnerable a CVE-2025-67779 (DoS) y CVE-2025-55183 (Fuga de código)${NC}"
    else
        echo -e "${GREEN}✅ Next.js ${NEXT_VERSION} está actualizado y seguro${NC}"
    fi
elif [[ "$NEXT_VERSION" == *"15.1"* ]]; then
    NEXT_NUM=$(echo "$NEXT_VERSION" | sed 's/15.1.//' | sed 's/[^0-9].*//')
    if [ -n "$NEXT_NUM" ] && [ "$NEXT_NUM" -lt 11 ]; then
        echo -e "${RED}❌ Next.js ${NEXT_VERSION} es VULNERABLE (necesita >= 15.1.11)${NC}"
    else
        echo -e "${GREEN}✅ Next.js ${NEXT_VERSION} está actualizado y seguro${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Next.js ${NEXT_VERSION} - Verificar si es versión estable segura${NC}"
fi

# Verificar React (Actualizado 13 Dic 2025 - Requiere 19.2.3)
if [[ "$REACT_VERSION" == *"19.2"* ]]; then
    REACT_NUM=$(echo "$REACT_VERSION" | sed 's/19.2.//' | sed 's/[^0-9].*//')
    if [ -n "$REACT_NUM" ] && [ "$REACT_NUM" -lt 3 ]; then
        echo -e "${RED}❌ React ${REACT_VERSION} es VULNERABLE (necesita >= 19.2.3)${NC}"
        echo -e "${RED}   ⚠️  Vulnerable a React2Shell mutado (parches del 11 dic incompletos)${NC}"
    else
        echo -e "${GREEN}✅ React ${REACT_VERSION} está actualizado y seguro${NC}"
    fi
elif [[ "$REACT_VERSION" == *"19.1"* ]] || [[ "$REACT_VERSION" == *"19.0"* ]]; then
    echo -e "${RED}❌ React ${REACT_VERSION} es VULNERABLE (necesita >= 19.2.3)${NC}"
else
    echo -e "${YELLOW}⚠️  React ${REACT_VERSION} - Verificar compatibilidad${NC}"
fi

echo ""
echo -e "${BLUE}📋 Recomendaciones (Actualizado 13 Dic 2025):${NC}"
echo ""
echo "1. Actualizar Next.js a versión SEGURA:"
echo "   cd apps/web && pnpm update next@16.0.10"
echo ""
echo "2. Actualizar React a versión SEGURA:"
echo "   cd apps/web && pnpm update react@19.2.3 react-dom@19.2.3"
echo ""
echo "3. Verificar cambios:"
echo "   cd apps/web && pnpm list next react react-dom"
echo ""
echo "4. Probar aplicación:"
echo "   pnpm build"
echo "   pnpm dev"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Los parches del 11 de diciembre resultaron incompletos.${NC}"
echo -e "${YELLOW}   Se requiere Next.js 16.0.10+ y React 19.2.3+ para protegerse contra:${NC}"
echo -e "${YELLOW}   - CVE-2025-67779 (DoS - Denegación de Servicio)${NC}"
echo -e "${YELLOW}   - CVE-2025-55183 (Fuga de código fuente)${NC}"
echo ""
echo "Para más detalles, consulta: docs/VULNERABILITY_ANALYSIS.md"


