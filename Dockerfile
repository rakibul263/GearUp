# syntax=docker/dockerfile:1

# -------------------------------------------------------------
# Stage 1: Base & Dependencies
# -------------------------------------------------------------
FROM node:24-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

# -------------------------------------------------------------
# Stage 2: Build
# -------------------------------------------------------------
FROM node:24-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src

# Generate Prisma client and compile TypeScript to ESM
RUN pnpm prisma:generate && pnpm build

# Prune devDependencies for lean production image
RUN pnpm prune --prod

# -------------------------------------------------------------
# Stage 3: Production Runtime
# -------------------------------------------------------------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install openssl for Prisma runtime engine if needed
RUN apk add --no-cache openssl curl

# Create non-root user
USER node

# Copy production assets
COPY --chown=node:node package.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/generated ./generated
COPY --chown=node:node --from=builder /app/prisma ./prisma

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "dist/src/server.js"]
