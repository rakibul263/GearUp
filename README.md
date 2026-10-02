# GearUp — Rent Sports & Outdoor Gear Instantly

[![Live API](https://img.shields.io/badge/Live_API-Render-46E3B7.svg?style=for-the-badge&logo=render)](https://gearup-backend-2.onrender.com)
[![Live Swagger Docs](https://img.shields.io/badge/Live_Docs-Swagger-85EA2D.svg?style=for-the-badge&logo=swagger)](https://gearup-backend-2.onrender.com/docs)
[![Docker](https://img.shields.io/badge/Docker_Hub-itzshuvo%2Fgearup--api-2496ED.svg?style=for-the-badge&logo=docker)](https://hub.docker.com/r/itzshuvo/gearup-api)
[![Node.js](https://img.shields.io/badge/Node.js-v24-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.8-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5.2-black.svg?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-v7.8-2D3748.svg?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791.svg?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF.svg?style=for-the-badge&logo=githubactions)](https://github.com/)
[![Tests](https://img.shields.io/badge/Tests-35%20Passed-brightgreen.svg?style=for-the-badge)]()

GearUp is an enterprise-grade backend API for renting sports and outdoor equipment. It empowers customers to browse available gear, reserve items with serializable concurrency controls, execute secure payments via Stripe, request partial or full refunds with idempotency guarantees, and review returned equipment. Providers manage inventory and orders, while administrators maintain platform governance.

> 🚀 **Live Production API**: [`https://gearup-backend-2.onrender.com`](https://gearup-backend-2.onrender.com)  
> 📚 **Interactive Swagger API Docs (Live)**: [`https://gearup-backend-2.onrender.com/docs`](https://gearup-backend-2.onrender.com/docs) *(Local: `http://localhost:5000/docs`)*  
> 📄 **Raw OpenAPI 3.0 Spec (Live)**: [`https://gearup-backend-2.onrender.com/api/docs/openapi.json`](https://gearup-backend-2.onrender.com/api/docs/openapi.json)  
> 🩺 **Production Health Probe**: [`https://gearup-backend-2.onrender.com/health`](https://gearup-backend-2.onrender.com/health)  
> 📊 **Online ERD Model**: [DrawSQL Diagram Link](https://drawsql.app/teams/inert-argon/diagrams/gearup)

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Database Entity Relationship Diagram (ERD)](#database-entity-relationship-diagram-erd)
- [Core Workflows & State Machines](#core-workflows--state-machines)
  - [1. Concurrent Rental Booking](#1-concurrent-rental-booking-with-serializable-isolation)
  - [2. Idempotent Payment & Refund Lifecycle](#2-idempotent-payment--refund-lifecycle)
  - [3. Distributed Refund Reconciliation](#3-distributed-refund-reconciliation)
- [Production Readiness & Hardening](#production-readiness--hardening)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Automated Testing & Benchmarks](#automated-testing--benchmarks)
- [Deployment & Containerization](#deployment--containerization)
- [Database Management & Backups](#database-management--backups)
- [License](#license)

---

## Tech Stack

| Category | Technology |
|---|---|
| **Runtime & Language** | Node.js v24 (ESM), TypeScript 5.8 (Strict Mode) |
| **Framework** | Express 5.2 |
| **ORM & Database** | Prisma ORM 7.8, PostgreSQL 16 (Neon Serverless PostgreSQL via `@prisma/adapter-pg`) |
| **Authentication** | JWT (JSON Web Tokens), Bcrypt password hashing with configurable salt rounds |
| **Validation** | Zod (strict schema coercion and validation middleware) |
| **Payment Gateway** | Stripe SDK (PaymentIntents, Webhook Signature Verification, Refunds) |
| **Security & Hardening** | OWASP Security Headers, Production CORS Whitelist, Tiered Sliding-Window Rate Limiter, Correlation IDs (`X-Request-Id`) |
| **Testing** | Node.js Native Test Runner (`node:test`, `node:assert`, `tsx --test`), Native Fetch HTTP Harness |
| **DevOps & CI/CD** | Multi-stage Docker, Docker Compose, GitHub Actions CI Workflow, Render Blueprint |

---

## System Architecture

GearUp adheres to a strictly layered, decoupled architecture with unidirectional dependencies:

```mermaid
flowchart TD
    Client(["HTTP Client (Browser / Mobile / Postman)"])
    
    subgraph Middlewares ["Security & Middleware Pipeline"]
        SecHeaders["Security Headers (OWASP)"]
        CorsMW["Production CORS Whitelist"]
        CorrID["Correlation ID (X-Request-Id)"]
        RateLim["Tiered Rate Limiter (Sliding Window)"]
        ReqLogger["Structured JSON Logger"]
        AuthMW["JWT Auth & Role Enforcement"]
        ZodMW["Zod Schema Validation"]
    end
    
    subgraph AppLayer ["Application Controllers & Services"]
        Router["Express Routers (/api/*)"]
        Ctrl["Controllers (HTTP Request / Response)"]
        Svc["Domain Services (Business Invariants)"]
    end
    
    subgraph Integrations ["Integrations & External Side-Effects"]
        StripeGateway["Stripe Gateway (PaymentIntents & Refunds)"]
        Reconcile["Refund Reconciliation Worker"]
    end
    
    subgraph DataLayer ["Data Persistence"]
        Prisma["Prisma ORM (Transactions & Query Engine)"]
        Postgres[(PostgreSQL / Neon DB)]
    end

    Client --> SecHeaders --> CorsMW --> CorrID --> RateLim --> ReqLogger --> Router
    Router --> AuthMW --> ZodMW --> Ctrl --> Svc
    Svc --> StripeGateway
    Svc --> Prisma --> Postgres
    Reconcile --> StripeGateway
    Reconcile --> Prisma
```

---

## Database Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Gear : "provides"
    User ||--o{ RentalOrder : "places"
    User ||--o{ Payment : "initiates"
    User ||--o{ PaymentRefund : "requests"
    User ||--o{ Review : "writes"

    Category ||--o{ Gear : "categorizes"

    Gear ||--o{ RentalOrderItem : "reserved_in"
    Gear ||--o{ Review : "receives"

    RentalOrder ||--|{ RentalOrderItem : "contains"
    RentalOrder ||--o{ Payment : "paid_through"

    Payment ||--o{ PaymentRefund : "refunded_via"

    User {
        string id PK
        string name
        string email UK
        string passwordHash
        string phone
        enum role "CUSTOMER | PROVIDER | ADMIN"
        enum status "ACTIVE | INACTIVE | SUSPENDED"
        datetime createdAt
        datetime updatedAt
    }

    Category {
        string id PK
        string name UK
        string slug UK
        string description
        datetime createdAt
        datetime updatedAt
    }

    Gear {
        string id PK
        string providerId FK
        string categoryId FK
        string name
        string slug UK
        string description
        string brand
        decimal pricePerDay
        int stock
        string imageUrl
        json specifications
        boolean isAvailable
        datetime createdAt
        datetime updatedAt
    }

    RentalOrder {
        string id PK
        string customerId FK
        datetime startTime
        datetime endTime
        decimal subtotal
        decimal totalAmount
        enum status "PLACED | CONFIRMED | PAID | PICKED_UP | RETURNED | CANCELED"
        datetime createdAt
        datetime updatedAt
    }

    RentalOrderItem {
        string id PK
        string rentalOrderId FK
        string gearItemId FK
        int quantity
        decimal pricePerDay
        int numberOfDays
        decimal subTotal
    }

    Payment {
        string id PK
        string userId FK
        string rentalOrderId FK
        string transactionId UK
        string idempotencyKey UK
        decimal amount
        enum currency "BDT | USD"
        enum method "STRIPE"
        enum provider "STRIPE"
        enum status "PENDING | COMPLETED | FAILED | REFUNDED | CANCELED"
        string clientSecret
        datetime paidAt
        datetime createdAt
        datetime updatedAt
    }

    PaymentRefund {
        string id PK
        string paymentId FK
        string userId FK
        decimal amount
        enum currency "BDT | USD"
        string reason
        enum status "PENDING | PROCESSING | COMPLETED | FAILED"
        string providerRefundId UK
        string idempotencyKey UK
        datetime refundedAt
        datetime createdAt
        datetime updatedAt
    }

    Review {
        string id PK
        string customerId FK
        string gearItemId FK
        int rating
        string comment
        datetime createdAt
        datetime updatedAt
    }
```

---

## Core Workflows & State Machines

### 1. Concurrent Rental Booking with Serializable Isolation

Prevents double-booking and inventory race conditions through PostgreSQL **Serializable isolation** with automatic retry loop:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer
    participant API as Rental Controller
    participant Service as Rental Service
    participant DB as PostgreSQL (tx)

    Customer->>API: POST /api/rentals (dates, items)
    API->>Service: createRental(customerId, data)
    
    loop Max 3 Retries on P2034 Conflict
        Service->>DB: BEGIN Serializable Transaction
        Service->>DB: Lock & Query Gear Items
        Service->>DB: Query Overlapping Active Rentals (startTime < end AND endTime > start)
        Service->>Service: Compute reservedQuantity per item
        alt requestedQuantity > availableStock
            Service-->>Customer: 409 Conflict ("Not enough stock available")
        else Stock Available
            Service->>DB: INSERT rental_orders (status = PLACED)
            Service->>DB: INSERT rental_order_items
            Service->>DB: COMMIT Transaction
            Service-->>Customer: 201 Created (Rental Order)
        end
    end
```

### 2. Idempotent Payment & Refund Lifecycle

Rentals and payments transition through well-defined lifecycle gates:

```mermaid
stateDiagram-v2
    direction LR

    [*] --> PLACED: Customer Books Gear
    PLACED --> CONFIRMED: Provider Confirms Order
    PLACED --> CANCELED: Customer Cancels Before Confirmation
    
    CONFIRMED --> PAID: Customer Pays via Stripe
    PAID --> PICKED_UP: Customer Collects Equipment
    PICKED_UP --> RETURNED: Equipment Inspected & Returned
    
    state PaymentState {
        [*] --> PENDING: Idempotency Key Registered
        PENDING --> COMPLETED: Stripe Webhook Verified
        PENDING --> FAILED: Card Declined
    }
    
    state RefundState {
        [*] --> PROCESSING: Idempotent Refund Created
        PROCESSING --> COMPLETED: Stripe Refund Succeeded
        PROCESSING --> FAILED: Stripe Rejected / Amount Exceeded
    }

    RETURNED --> RefundState: Eligible for Deposit/Partial Refund
```

### 3. Distributed Refund Reconciliation

Solves the distributed side-effect limitation when external APIs succeed but the database fails to commit or drops connection:

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Admin / Scheduled Job
    participant Reconcile as Reconcile Service
    participant DB as PostgreSQL
    participant Stripe as Stripe API

    Cron->>Reconcile: POST /api/admin/refunds/reconcile
    Reconcile->>DB: Find refunds where status = 'PROCESSING' and age > 5m
    loop For each stuck refund
        alt providerRefundId exists
            Reconcile->>Stripe: stripe.refunds.retrieve(id)
        else Match by payment_intent
            Reconcile->>Stripe: stripe.refunds.list(payment_intent)
        end
        alt status == succeeded
            Reconcile->>DB: UPDATE status = 'COMPLETED', refundedAt = stripe.created
        else status == failed or age > 15m without Stripe match
            Reconcile->>DB: UPDATE status = 'FAILED'
        end
    end
    Reconcile-->>Cron: 200 OK (Reconciliation Report)
```

---

## Production Readiness & Hardening

1. **Security Headers**:
   - `X-Content-Type-Options: nosniff` (guards against MIME-type sniffing).
   - `X-Frame-Options: DENY` (prevents clickjacking).
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (enforces HTTPS in production).
   - `Referrer-Policy: strict-origin-when-cross-origin`.
   - `Permissions-Policy: geolocation=(), camera=(), microphone=()`.
   - Removal of `X-Powered-By` header.

2. **Production CORS**:
   - Environment-driven whitelist (`CORS_ORIGIN="https://gearup.app,https://admin.gearup.app"`).
   - Blocks unauthorized cross-origin requests while allowing server-to-server and non-browser callers.
   - Preflight options cached for 24 hours (`maxAge: 86400`).

3. **Tiered Sliding-Window Rate Limiting**:
   - **Global Limiter**: 100 req / 15 min per IP.
   - **Auth Limiter**: 10 req / 15 min per IP on `/api/auth/login` and `/api/auth/register` to block brute-force attacks.
   - **Payment Limiter**: 25 req / 15 min per IP on `/api/payments/*`.
   - Standard RFC headers (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After`).

4. **Structured JSON Logging & Distributed Tracing**:
   - Auto-generates or preserves `X-Request-Id` correlation tokens across request boundaries.
   - In production (`NODE_ENV=production`), logs are emitted in JSON format with timestamps, duration, and client IPs for ingestion by Datadog, AWS CloudWatch, or Grafana Loki.

5. **Sanitized Queries & Zero Password Leaks**:
   - `passwordHash` is excluded from all user queries via explicit Prisma `select` projections.

---

## API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public (Rate Limited) | Register a new CUSTOMER or PROVIDER |
| `POST` | `/api/auth/login` | Public (Rate Limited) | Authenticate user & receive JWT |
| `GET` | `/api/auth/me` | Bearer Token | Fetch authenticated user profile |

### Categories (`/api/categories`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Public | List categories with active gear count |
| `GET` | `/api/categories/:id` | Public | Get single category details |
| `POST` | `/api/categories` | ADMIN | Create new category |
| `PATCH` | `/api/categories/:id` | ADMIN | Update category name, slug, or description |
| `DELETE` | `/api/categories/:id` | ADMIN | Delete category (blocked if gear items exist) |

### Gear Management (`/api/gears`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/gears` | Public | Paginated gear list with search, category, brand filters |
| `GET` | `/api/gears/:id` | Public | Gear details with average rating & review count |
| `POST` | `/api/gears` | PROVIDER | Create gear inventory |
| `PATCH` | `/api/gears/:id` | PROVIDER | Update gear details (owner only) |
| `DELETE` | `/api/gears/:id` | PROVIDER | Delete gear (blocked if rental history exists) |

### Rentals & Bookings (`/api/rentals`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/rentals` | CUSTOMER | Create rental order with serializable concurrency lock |
| `GET` | `/api/rentals` | CUSTOMER | List customer rental bookings |
| `GET` | `/api/rentals/:id` | CUSTOMER | Get rental order details |
| `PATCH` | `/api/rentals/:id/cancel`| CUSTOMER | Cancel a PLACED rental order |

### Provider Orders (`/api/provider/rentals`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/provider/rentals` | PROVIDER | List orders containing provider's gear |
| `PATCH` | `/api/provider/rentals/:id/status` | PROVIDER | Advance status (`CONFIRMED`, `PICKED_UP`, `RETURNED`) |

### Payments & Refunds (`/api/payments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/payments` | CUSTOMER | Initialize Stripe PaymentIntent (`Idempotency-Key` required) |
| `GET` | `/api/payments` | CUSTOMER | List customer payment history |
| `GET` | `/api/payments/:id` | CUSTOMER | Get single payment details |
| `POST` | `/api/payments/refunds` | CUSTOMER | Request partial/full refund (`Idempotency-Key` required) |
| `POST` | `/api/payments/webhook` | Stripe Webhook | Raw webhook endpoint for Stripe events |

### Reviews (`/api/reviews`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/reviews` | CUSTOMER | Review gear from a RETURNED rental order |
| `GET` | `/api/reviews/gear/:gearItemId` | Public | Paginated reviews for a gear item |

### Admin Platform Management (`/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/users` | ADMIN | List all registered users with pagination |
| `PATCH` | `/api/admin/users/:id/status` | ADMIN | Update user status (`ACTIVE`, `SUSPENDED`) |
| `GET` | `/api/admin/gear` | ADMIN | List all gear across all providers |
| `DELETE` | `/api/admin/gear/:id` | ADMIN | Remove gear (checks active rental locks) |
| `GET` | `/api/admin/rentals` | ADMIN | List all system rentals with payment audit |
| `POST` | `/api/admin/refunds/reconcile` | ADMIN | Trigger automated Stripe refund reconciliation |

---

## Getting Started

### Prerequisites
- Node.js >= 20 (v24 recommended)
- PostgreSQL >= 15 (or Neon Serverless PostgreSQL)
- pnpm >= 9

### Environment Setup

Create a `.env` file in the project root:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/gearup?schema=public"

JWT_SECRET="supersecretproductionjwtkeyminimum32characterslong"
JWT_EXPIRES_IN="7d"
SALT_ROUNDS=10

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
APP_BASE_URL="http://localhost:5000"
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"
```

### Installation & Database Initialization

```bash
# 1. Install dependencies
pnpm install

# 2. Validate Prisma schema
pnpm prisma:validate

# 3. Synchronize database schema
pnpm prisma db push

# 4. Generate Prisma Client
pnpm prisma:generate

# 5. Start development server with live reload
pnpm dev
```

Local server will run at `http://localhost:5000` (Local Swagger: `http://localhost:5000/docs`).  
Live Production Server: [`https://gearup-backend-2.onrender.com`](https://gearup-backend-2.onrender.com) (Live Swagger: [`https://gearup-backend-2.onrender.com/docs`](https://gearup-backend-2.onrender.com/docs)).

---

## Automated Testing & Benchmarks

GearUp includes a full suite of unit, integration, and concurrency load tests utilizing Node.js's native test runner (`node:test`) and TypeScript without heavy external test framework overhead.

```bash
# Run all automated tests (35 tests across 16 suites)
pnpm test

# Run unit tests only (date, jwt, password, pagination, validation, AppError)
pnpm test:unit

# Run integration tests only (health, 404, auth validation, docs, security headers)
pnpm test:integration

# Run concurrency & load benchmark against running server
pnpm test:load
```

### Benchmark Metrics Sample (50 Concurrent Users, 200 Requests)
```text
Target URL        : http://localhost:5000
Concurrent Users  : 25
Total Requests    : 200
Throughput (RPS)  : 382 requests/sec
p50 (Median)      : 2.15 ms
p95               : 8.40 ms
p99               : 14.20 ms
Max Latency       : 18.50 ms
```

---

## Deployment & Containerization

### Docker Deployment

GearUp includes a production-optimized, multi-stage `Dockerfile` (using non-root user `node` and minimal Alpine base):

```bash
# Build the production Docker image
docker build -t gearup-api:latest .

# Run containerized API
docker run -p 5000:5000 --env-file .env gearup-api:latest
```

### Docker Compose (Full Stack with PostgreSQL)

```bash
# Boot PostgreSQL and GearUp API together
docker-compose up -d

# Verify container health
docker-compose ps
```

### Cloud Deployment (Render / Railway / AWS)

A `render.yaml` blueprint is included in the root directory for automated infrastructure-as-code deployments on Render. Simply connect your GitHub repository and Render will automatically configure the build and environment variables.

---

## Database Management & Backups

### Automated Database Backup Script

An automated backup script with automatic rotation is located at [`scripts/db-backup.sh`](scripts/db-backup.sh):

```bash
# Grant execution permissions
chmod +x scripts/db-backup.sh

# Trigger an immediate compressed backup
./scripts/db-backup.sh
```

Backups are saved to `./backups/gearup_backup_YYYYMMDD_HHMMSS.sql.gz` and files older than 30 days are automatically pruned.

#### Setup Nightly Cron Backup (Linux / macOS)
```bash
# Run backup every night at 2:00 AM
0 2 * * * cd /path/to/GearUp && ./scripts/db-backup.sh >> /var/log/gearup_backup.log 2>&1
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
