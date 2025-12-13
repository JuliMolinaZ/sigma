#!/bin/bash

# Script de Verificación de Seguridad - Dependencias Críticas
# Fecha: 13 de Diciembre de 2025
# Valida todas las dependencias críticas contra vulnerabilidades React2Shell

set -e

echo "🔒 SIGMA ERP - Verificación de Seguridad de Dependencias"
echo "=========================================================="
echo "Fecha: $(date)"
echo ""

cd "$(dirname "$0")/../apps/web" || exit 1

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables de versión requerida
REQUIRED_NEXT="16.0.10"
REQUIRED_REACT="19.2.3"
REQUIRED_REACT_DOM="19.2.3"
REQUIRED_SHARP="0.33.5"

echo -e "${BLUE}📋 Verificando dependencias críticas...${NC}"
echo ""

# Función para verificar versión
check_version() {
    local package=$1
    local required=$2
    local installed=$(pnpm list "$package" 2>/dev/null | grep "$package" | head -1 | awk '{print $2}' || echo "not found")
    
    if [ "$installed" = "not found" ]; then
        echo -e "${YELLOW}⚠️  $package: No encontrado${NC}"
        return 1
    fi
    
    # Comparar versiones (simplificado)
    if [ "$installed" = "$required" ] || [[ "$installed" > "$required" ]] || [[ "$installed" == "$required"* ]]; then
        echo -e "${GREEN}✅ $package: $installed (requerido: >= $required)${NC}"
        return 0
    else
        echo -e "${RED}❌ $package: $installed (requerido: >= $required)${NC}"
        return 1
    fi
}

# 1. Nivel Crítico - Vectores de Ataque Directo
echo -e "${BLUE}1️⃣  Nivel Crítico (Vectores de Ataque Directo)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

NEXT_VERSION=$(pnpm list next 2>/dev/null | grep "next" | head -1 | awk '{print $2}' || echo "")
REACT_VERSION=$(pnpm list react 2>/dev/null | grep "react " | head -1 | awk '{print $2}' || echo "")
REACT_DOM_VERSION=$(pnpm list react-dom 2>/dev/null | grep "react-dom" | head -1 | awk '{print $2}' || echo "")

check_version "next" "$REQUIRED_NEXT"
check_version "react" "$REQUIRED_REACT"
check_version "react-dom" "$REQUIRED_REACT_DOM"

# Verificar react-server-dom-webpack (dependencia anidada)
echo ""
echo -e "${BLUE}🔍 Verificando dependencias anidadas críticas...${NC}"
REACT_SERVER_WEBPACK=$(pnpm list react-server-dom-webpack 2>/dev/null | grep "react-server-dom-webpack" | head -1 | awk '{print $2}' || echo "not found")
if [ "$REACT_SERVER_WEBPACK" != "not found" ]; then
    check_version "react-server-dom-webpack" "$REQUIRED_REACT"
else
    echo -e "${YELLOW}⚠️  react-server-dom-webpack: No encontrado explícitamente (puede estar anidado en Next.js)${NC}"
    echo -e "${YELLOW}   Si Next.js está en $REQUIRED_NEXT, debería traer la versión correcta${NC}"
fi

# Verificar react-server-dom-turbopack (dependencia anidada)
REACT_SERVER_TURBO=$(pnpm list react-server-dom-turbopack 2>/dev/null | grep "react-server-dom-turbopack" | head -1 | awk '{print $2}' || echo "not found")
if [ "$REACT_SERVER_TURBO" != "not found" ]; then
    check_version "react-server-dom-turbopack" "$REQUIRED_REACT"
else
    echo -e "${YELLOW}⚠️  react-server-dom-turbopack: No encontrado explícitamente (puede estar anidado en Next.js)${NC}"
    echo -e "${YELLOW}   Si Next.js está en $REQUIRED_NEXT, debería traer la versión correcta${NC}"
fi

# 2. Nivel Alto - Dependencias de Soporte
echo ""
echo -e "${BLUE}2️⃣  Nivel Alto (Dependencias de Soporte)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ESLINT_NEXT_VERSION=$(pnpm list eslint-config-next 2>/dev/null | grep "eslint-config-next" | head -1 | awk '{print $2}' || echo "")
if [ -n "$ESLINT_NEXT_VERSION" ]; then
    if [ "$ESLINT_NEXT_VERSION" = "$REQUIRED_NEXT" ] || [[ "$ESLINT_NEXT_VERSION" > "$REQUIRED_NEXT" ]]; then
        echo -e "${GREEN}✅ eslint-config-next: $ESLINT_NEXT_VERSION (debe coincidir con Next.js)${NC}"
    else
        echo -e "${RED}❌ eslint-config-next: $ESLINT_NEXT_VERSION (requerido: >= $REQUIRED_NEXT)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  eslint-config-next: No encontrado${NC}"
fi

TYPES_REACT=$(pnpm list @types/react 2>/dev/null | grep "@types/react" | head -1 | awk '{print $2}' || echo "")
if [ -n "$TYPES_REACT" ]; then
    echo -e "${GREEN}✅ @types/react: $TYPES_REACT${NC}"
else
    echo -e "${YELLOW}⚠️  @types/react: No encontrado${NC}"
fi

TYPES_REACT_DOM=$(pnpm list @types/react-dom 2>/dev/null | grep "@types/react-dom" | head -1 | awk '{print $2}' || echo "")
if [ -n "$TYPES_REACT_DOM" ]; then
    echo -e "${GREEN}✅ @types/react-dom: $TYPES_REACT_DOM${NC}"
else
    echo -e "${YELLOW}⚠️  @types/react-dom: No encontrado${NC}"
fi

SHARP_VERSION=$(pnpm list sharp 2>/dev/null | grep "sharp" | head -1 | awk '{print $2}' || echo "")
if [ -n "$SHARP_VERSION" ]; then
    if [[ "$SHARP_VERSION" > "$REQUIRED_SHARP" ]] || [ "$SHARP_VERSION" = "$REQUIRED_SHARP" ]; then
        echo -e "${GREEN}✅ sharp: $SHARP_VERSION (requerido: >= $REQUIRED_SHARP)${NC}"
    else
        echo -e "${RED}❌ sharp: $SHARP_VERSION (requerido: >= $REQUIRED_SHARP)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  sharp: No encontrado (puede no ser necesario)${NC}"
fi

# 3. Verificación de versiones múltiples de React
echo ""
echo -e "${BLUE}3️⃣  Verificación de Conflictos de Versiones${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

REACT_VERSIONS=$(pnpm list --depth=10 2>/dev/null | grep -E "react@[0-9]" | grep -v "react-dom" | awk '{print $2}' | sort -u)
REACT_COUNT=$(echo "$REACT_VERSIONS" | wc -l | xargs)

if [ "$REACT_COUNT" -gt 1 ]; then
    echo -e "${RED}❌ Se encontraron múltiples versiones de React:${NC}"
    echo "$REACT_VERSIONS" | while read version; do
        echo -e "${RED}   - $version${NC}"
    done
    echo -e "${RED}   ⚠️  Esto puede causar fallos de hidratación${NC}"
else
    echo -e "${GREEN}✅ Solo se encontró una versión de React${NC}"
fi

# Resumen
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📊 Resumen de Seguridad:${NC}"
echo ""

if [ "$NEXT_VERSION" = "$REQUIRED_NEXT" ] && [ "$REACT_VERSION" = "$REQUIRED_REACT" ] && [ "$REACT_DOM_VERSION" = "$REQUIRED_REACT_DOM" ]; then
    echo -e "${GREEN}✅ Estado: SEGURO${NC}"
    echo ""
    echo "Todas las dependencias críticas están actualizadas."
    echo "Tu aplicación está protegida contra:"
    echo "  - CVE-2025-67779 (DoS - Denegación de Servicio)"
    echo "  - CVE-2025-55183 (Fuga de código fuente)"
    echo "  - CVE-2025-55182 (RCE - Ejecución remota de código)"
else
    echo -e "${RED}❌ Estado: VULNERABLE${NC}"
    echo ""
    echo "Se encontraron dependencias desactualizadas."
    echo ""
    echo -e "${YELLOW}🛠️  Solución Recomendada (Limpieza Profunda):${NC}"
    echo ""
    echo "1. Borrar node_modules y lockfile:"
    echo "   rm -rf node_modules pnpm-lock.yaml"
    echo ""
    echo "2. Forzar versiones en package.json:"
    echo "   \"next\": \"^16.0.10\","
    echo "   \"react\": \"^19.2.3\","
    echo "   \"react-dom\": \"^19.2.3\""
    echo ""
    echo "3. Reinstalar:"
    echo "   pnpm install"
    echo ""
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
