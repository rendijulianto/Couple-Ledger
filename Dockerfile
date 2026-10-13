# ==========================================
# Multi-stage Dockerfile: Couple Ledger (Production)
# ==========================================

# --- Stage 1: Dependencies ---
FROM oven/bun:1-alpine AS deps
WORKDIR /app

COPY package.json bun.lock tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN bun install --frozen-lockfile

# --- Stage 2: Build ---
FROM deps AS build
WORKDIR /app

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY apps/web ./apps/web

# Build frontend (Vite React PWA)
WORKDIR /app/apps/web
RUN bun run build

# Build backend API
WORKDIR /app/apps/api
RUN bun run build

# --- Stage 3: Runtime (Production) ---
FROM oven/bun:1-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV APP_ENV=production

# Install curl for healthcheck
RUN apk add --no-cache curl postgresql16-client

# Copy built artifacts and database migrations
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/src/db ./apps/api/src/db
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

USER bun
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["bun", "apps/api/dist/index.js"]

