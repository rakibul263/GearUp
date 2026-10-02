# syntax=docker/dockerfile:1

# -------------------------------------------------------------
# Stage 1: Base & Dependencies
# -------------------------------------------------------------
FROM node:24-alpine AS deps
WORKDIR /app

# Install native build tools for bcrypt and native compilation on Alpine musl
RUN apk add --no-cache python3 make g++ gcc libc-dev openssl

# Install pnpm pinned to v9 to match lockfileVersion: '9.0'
RUN npm install -g pnpm@9.15.4

# Copy dependency manifests and configuration
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* prisma.config.ts* ./
COPY prisma ./prisma

# Install all dependencies (development + production) with fallback if platform resolution differs
RUN pnpm install --frozen-lockfile || pnpm install

# -------------------------------------------------------------
# Stage 2: Build Application
# -------------------------------------------------------------
FROM node:24-alpine AS builder
WORKDIR /app

# Install native runtime/openssl tools and pnpm
RUN apk add --no-cache openssl
RUN npm install -g pnpm@9.15.4

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* prisma.config.ts* tsconfig.json ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src

# Generate Prisma client and compile TypeScript to ESM
RUN pnpm prisma:generate && pnpm build

# Prune devDependencies for lean production image
RUN pnpm prune --prod || true

# -------------------------------------------------------------
# Stage 3: Minimal Production Runtime
# -------------------------------------------------------------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install runtime libraries (OpenSSL for Prisma engine, curl for healthcheck, libstdc++ for native addons)
RUN apk add --no-cache openssl curl libstdc++

# Run container as unprivileged non-root user
USER node

# Copy production assets
COPY --chown=node:node package.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/generated ./generated
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/prisma.config.ts* ./

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "dist/src/server.js"]
