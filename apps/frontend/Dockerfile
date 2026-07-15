# ---- Build stage ----
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/shared-types/package.json  ./packages/shared-types/
COPY packages/shared-ui/package.json     ./packages/shared-ui/
COPY packages/shared-config/package.json ./packages/shared-config/
COPY apps/backend/package.json           ./apps/backend/
COPY apps/frontend/package.json          ./apps/frontend/

RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm ci --include=dev

COPY packages/ ./packages/
COPY apps/frontend/ ./apps/frontend/

# Turbo builds shared-types + shared-ui first, then frontend
RUN ./node_modules/.bin/turbo run build --filter=frontend

# ---- Production stage ----
FROM nginx:alpine
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
