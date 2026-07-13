FROM node:20-alpine AS builder
WORKDIR /build

# 1. Build shared-types
COPY packages/shared-config/ ./packages/shared-config/
COPY packages/shared-types/  ./packages/shared-types/
WORKDIR /build/packages/shared-types
RUN npm install && npm run build

# 2. Install backend deps as a standalone project
#    Strip workspace package refs so npm doesn't hit the registry for them,
#    then add compiled shared-types via local path.
WORKDIR /build/apps/backend
COPY apps/backend/ ./
RUN node -e " \
  const fs = require('fs'); \
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); \
  ['@wasslni/shared-types','@wasslni/shared-ui','@wasslni/shared-config'] \
    .forEach(k => delete pkg.dependencies?.[k]); \
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2)); \
"
RUN npm install
RUN npm install /build/packages/shared-types --no-save
RUN ./node_modules/.bin/nest build

# ---- Runtime image ----
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /build/apps/backend/node_modules ./node_modules
COPY --from=builder /build/apps/backend/dist         ./dist
# Symlink in node_modules resolves to /packages/shared-types (4 levels up from /app/node_modules/@wasslni/)
COPY --from=builder /build/packages/shared-types/dist    /packages/shared-types/dist
COPY --from=builder /build/packages/shared-types/package.json /packages/shared-types/

EXPOSE 3000
CMD ["node", "dist/main"]
