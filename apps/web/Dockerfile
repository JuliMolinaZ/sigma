# Dockerfile para la Web (Next.js)
FROM node:20-alpine AS base

# Instalar pnpm
RUN npm install -g pnpm@9.15.4

# Instalar dependencias del sistema
RUN apk add --no-cache libc6-compat openssl curl

FROM base AS deps
WORKDIR /app

# Variables de entorno para mejorar la descarga
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copiar archivos de configuración del monorepo
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages ./packages
COPY apps/web/package.json ./apps/web/
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/hooks/package.json ./packages/hooks/

# Instalar dependencias con retry en caso de error de red
RUN pnpm install --frozen-lockfile --fetch-timeout=600000 || \
    (echo "⚠️ Primera instalación falló, reintentando..." && \
     sleep 5 && \
     pnpm install --frozen-lockfile --fetch-timeout=600000) || \
    (echo "⚠️ Segunda instalación falló, último intento..." && \
     sleep 10 && \
     pnpm install --frozen-lockfile --fetch-timeout=600000)

FROM base AS builder
WORKDIR /app

# Copiar dependencias
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages

# Copiar código fuente y archivos de configuración de la raíz
# Necesario para turbo: package.json, pnpm-workspace.yaml, pnpm-lock.yaml
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web ./apps/web
COPY packages ./packages
COPY turbo.json tsconfig.json ./

# Build de la aplicación usando Turbo desde la raíz del monorepo
# Mantener WORKDIR en /app (raíz del monorepo)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

# Construir usando Turbo desde la raíz del monorepo
# Verificar que package.json existe antes de ejecutar turbo
RUN test -f package.json && pnpm turbo build --filter=web || (echo "❌ Error: package.json no encontrado en /app" && ls -la /app && exit 1)

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--openssl-legacy-provider"

# Crear usuario no root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/package.json ./apps/web/

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Comando de inicio
CMD ["node", "apps/web/server.js"]

