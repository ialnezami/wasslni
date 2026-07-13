# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests for layer-cache-friendly install
COPY package.json package-lock.json turbo.json ./
COPY packages/shared-types/package.json  ./packages/shared-types/
COPY packages/shared-ui/package.json     ./packages/shared-ui/
COPY packages/shared-config/package.json ./packages/shared-config/
COPY apps/backend/package.json           ./apps/backend/
COPY apps/frontend/package.json          ./apps/frontend/

RUN npm ci

# Copy source for packages and backend only
COPY packages/ ./packages/
COPY apps/backend/ ./apps/backend/

# Turbo builds shared-types first (honoring ^build), then backend
RUN npx turbo run build --filter=backend

# ---- Production stage ----
FROM node:20-alpine
WORKDIR /app

# Copy manifests so npm ci can create workspace symlinks
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json  ./packages/shared-types/
COPY packages/shared-ui/package.json     ./packages/shared-ui/
COPY packages/shared-config/package.json ./packages/shared-config/
COPY apps/backend/package.json           ./apps/backend/
COPY apps/frontend/package.json          ./apps/frontend/

RUN npm ci --omit=dev

# Copy compiled workspace packages (symlinked from node_modules at runtime)
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist

# Copy compiled backend
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

WORKDIR /app/apps/backend
EXPOSE 3000
CMD ["node", "dist/main"]
