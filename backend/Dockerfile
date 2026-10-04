# syntax=docker/dockerfile:1
# Build context: the repository root (npm workspaces share one lockfile).

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# The schema comes in early so the install hooks can run `prisma generate`.
COPY backend/package.json backend/prisma.config.ts backend/
COPY backend/prisma backend/prisma
COPY frontend/package.json frontend/
RUN npm ci --workspace backend

FROM deps AS build
COPY backend backend
RUN npm run build -w backend

# One-shot job: apply migrations, then load the demo data (idempotent).
FROM build AS migrate
WORKDIR /app/backend
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]

FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
# Runtime needs no install scripts (no native modules; the client is compiled into dist).
RUN npm ci --workspace backend --omit=dev --ignore-scripts

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app/node_modules node_modules
COPY --from=build /app/backend/dist backend/dist
COPY backend/package.json backend/
WORKDIR /app/backend
USER node
EXPOSE 4100
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD wget -qO- http://localhost:4100/api/health || exit 1
CMD ["node", "dist/main.js"]
