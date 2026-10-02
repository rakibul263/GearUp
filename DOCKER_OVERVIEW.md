# GearUp API — Sports & Outdoor Equipment Rental Backend

[![Live API](https://img.shields.io/badge/Live_API-Render-46E3B7.svg?style=flat-square&logo=render)](https://gearup-backend-2.onrender.com)
[![Live Swagger Docs](https://img.shields.io/badge/Live_Docs-Swagger-85EA2D.svg?style=flat-square&logo=swagger)](https://gearup-backend-2.onrender.com/docs)
[![Docker Pulls](https://img.shields.io/docker/pulls/itzshuvo/gearup-api?style=flat-square&logo=docker)](https://hub.docker.com/r/itzshuvo/gearup-api)
[![Docker Image Size](https://img.shields.io/docker/image-size/itzshuvo/gearup-api/latest?style=flat-square&logo=docker)](https://hub.docker.com/r/itzshuvo/gearup-api)
[![Node.js](https://img.shields.io/badge/Node.js-v24-339933.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.8-3178C6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-v7.8-2D3748.svg?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org/)

**GearUp** is an enterprise-grade backend REST API for renting sports and outdoor gear. Built with Node.js 24, TypeScript strict mode, Express, Prisma ORM, and PostgreSQL, it features serializable concurrency controls for zero-double-booking, idempotent Stripe payment & refund flows, sliding-window rate limiting, and an interactive OpenAPI 3.0 (Swagger) UI.

> 🚀 **Live Production Deployment**: [`https://gearup-backend-2.onrender.com`](https://gearup-backend-2.onrender.com)  
> 📚 **Interactive Swagger API Docs (Live)**: [`https://gearup-backend-2.onrender.com/docs`](https://gearup-backend-2.onrender.com/docs)  
> 📄 **Raw OpenAPI 3.0 JSON**: [`https://gearup-backend-2.onrender.com/api/docs/openapi.json`](https://gearup-backend-2.onrender.com/api/docs/openapi.json)  
> 🩺 **Live Health Probe**: [`https://gearup-backend-2.onrender.com/health`](https://gearup-backend-2.onrender.com/health)

---

## ⚡ Quick Start

### 1. Run with Docker (Standalone)

```bash
docker run -d \
  --name gearup-api \
  -p 5000:5000 \
  -e PORT=5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://user:password@host:5432/gearup_db?sslmode=require" \
  -e JWT_SECRET="your-super-secret-jwt-key-min-32-chars" \
  -e APP_BASE_URL="http://localhost:5000" \
  itzshuvo/gearup-api:latest
```

### 2. Run with Docker Compose (API + PostgreSQL)

Create a `docker-compose.yml` file:

```yaml
version: "3.8"

services:
  app:
    image: itzshuvo/gearup-api:latest
    container_name: gearup-api
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - NODE_ENV=production
      - DATABASE_URL=postgresql://gearup_user:gearup_pass@postgres:5432/gearup_db?schema=public
      - JWT_SECRET=supersecretproductionjwtkeyminimum32characterslong
      - JWT_EXPIRES_IN=7d
      - SALT_ROUNDS=10
      - APP_BASE_URL=http://localhost:5000
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY:-}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET:-}
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    container_name: gearup-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: gearup_user
      POSTGRES_PASSWORD: gearup_pass
      POSTGRES_DB: gearup_db
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gearup_user -d gearup_db"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
```

Start the application stack:

```bash
docker compose up -d
```

---

## 🛠️ Verification & Endpoints

Once running, verify the service:

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | Container liveness & health check |
| `/docs` | `GET` | Interactive Swagger UI API documentation |
| `/api/docs/openapi.json` | `GET` | Raw OpenAPI 3.0 JSON specification |
| `/api/auth/register` | `POST` | User registration (CUSTOMER / PROVIDER) |
| `/api/auth/login` | `POST` | User authentication & JWT token generation |
| `/api/gears` | `GET` | Browse available sports & outdoor gear |
| `/api/rentals` | `POST` | Reserve rental gear with overlap conflict prevention |
| `/api/payments/create-intent` | `POST` | Initialize idempotent Stripe payment intent |

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `PORT` | Optional | `5000` | Port on which the Express server listens |
| `NODE_ENV` | Optional | `production` | Environment mode (`production`, `development`, `test`) |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string (supports Neon Serverless & local Postgres) |
| `JWT_SECRET` | **Yes** | — | Cryptographic secret key for signing JWTs (min 32 characters) |
| `JWT_EXPIRES_IN` | Optional | `7d` | Token expiry duration (e.g. `1d`, `7d`) |
| `SALT_ROUNDS` | Optional | `10` | Salt rounds for bcrypt password hashing |
| `APP_BASE_URL` | Optional | `https://gearup-backend-2.onrender.com` | Base public URL of the API (`http://localhost:5000` for local dev) |
| `STRIPE_SECRET_KEY` | Optional | — | Stripe Secret API key for payment processing |
| `STRIPE_WEBHOOK_SECRET` | Optional | — | Secret key for verifying inbound Stripe webhooks |
| `CORS_ORIGIN` | Optional | `*` | Allowed CORS origins (comma-separated for multiple domains) |

---

## 🔒 Security & Architecture Features

* **Multi-stage Lean Image**: Built on `node:24-alpine` with an unprivileged non-root `node` user (~159 MB compressed).
* **Concurrency Control**: Prevents double-booking using PostgreSQL transaction isolation and date range overlap checks.
* **Idempotent Payments & Refunds**: Stripe webhooks verified with signatures and deduplicated via transaction logs.
* **Rate Limiting**: Sliding-window rate limiter protecting against brute-force attacks on auth and payment endpoints.
* **Security Headers**: Standard OWASP HTTP security headers (`Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `HSTS`).
* **Observability**: Correlation IDs (`X-Request-Id`) across all incoming requests and structured JSON logging.

---

## 🏷️ Available Tags

* `itzshuvo/gearup-api:latest` — Latest production build on `main` branch.
* `itzshuvo/gearup-api:v1.0.0` — Initial stable release v1.0.0.

---

## 📄 License & Maintainer

* **Author**: Shuvo ([itzshuvo](https://hub.docker.com/u/itzshuvo))
* **License**: MIT
