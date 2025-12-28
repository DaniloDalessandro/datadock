# ============================================
# Dockerfile - Frontend Next.js (DataDock)
# Multi-stage build para otimização de tamanho
# ============================================

# Estágio 1: Instalação de dependências
FROM node:20-alpine AS deps
WORKDIR /app

# Copiar arquivos de dependências (cache layer)
COPY package.json package-lock.json* ./

# Instalar TODAS as dependências (incluindo devDependencies para o build)
RUN npm ci

# Estágio 2: Build da aplicação
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependências do estágio anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desabilitar telemetria do Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Build da aplicação Next.js (gera output standalone)
RUN npm run build

# Estágio 3: Imagem final de produção
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar apenas arquivos necessários para produção
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Health check: verifica se a aplicação está respondendo
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Iniciar servidor Next.js standalone
CMD ["node", "server.js"]
