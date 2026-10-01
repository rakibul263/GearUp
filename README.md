# 🏕️ GearUp — Outdoor & Sports Gear Rental Backend API

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.8-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5.2-black.svg?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-v7.8-2D3748.svg?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-API-635BFF.svg?style=for-the-badge&logo=stripe)](https://stripe.com/)
[![pnpm](https://img.shields.io/badge/pnpm-v9+-F69220.svg?style=for-the-badge&logo=pnpm)](https://pnpm.io/)
[![DrawSQL ERD](https://img.shields.io/badge/ERD-DrawSQL-2563EB.svg?style=for-the-badge)](https://drawsql.app/teams/inert-argon/diagrams/gearup)
[![License](https://img.shields.io/badge/license-MIT-purple.svg?style=for-the-badge)](#license)

**GearUp** is a production-grade, peer-to-peer rental marketplace backend designed for outdoor, camping, sports, and adventure equipment. It connects equipment **Providers** with adventure-seeking **Customers**, providing real-time inventory management, concurrency-safe booking, flexible search and filtering, role-based access control, Stripe payment with idempotency & refunds, post-rental gear reviews, and comprehensive administrative governance.

---

## 📑 Table of Contents

- [Project Overview](#-project-overview)
- [Architectural Highlights & Hardening](#-architectural-highlights--hardening)
- [Tech Stack](#-tech-stack)
- [System Architecture Flow](#-system-architecture-flow)
- [Database Schema & Models](#-database-schema--models)
- [Complete API Reference](#-complete-api-reference)
  - [1. Health & Base](#1-health--base)
  - [2. Authentication (`/api/auth`)](#2-authentication-apiauth)
  - [3. Categories (`/api/categories`)](#3-categories-apicategories)
  - [4. Gear Inventory (`/api/gear` & `/api/gears`)](#4-gear-inventory-apigear--apigears)
  - [5. Rentals & Booking (`/api/rentals`)](#5-rentals--booking-apirentals)
  - [6. Provider Rental Management (`/api/provider/rentals`)](#6-provider-rental-management-apiproviderrentals)
  - [7. Payments & Stripe Webhooks (`/api/payments`)](#7-payments--stripe-webhooks-apipayments)
  - [8. Reviews (`/api/reviews`)](#8-reviews-apireviews)
  - [9. Admin Governance (`/api/admin`)](#9-admin-governance-apiadmin)
- [Environment Configuration](#-environment-configuration)
- [Getting Started (Setup with pnpm)](#-getting-started-setup-with-pnpm)
- [Project Directory Structure](#-project-directory-structure)
- [Available Scripts](#-available-scripts)
- [Security Best Practices Implemented](#-security-best-practices-implemented)
- [License](#-license)

---

## 🌟 Project Overview

Outdoor adventure gear is often expensive, infrequently used, and space-consuming. GearUp provides an end-to-end backend platform:
- **Customers**: Browse equipment with rich search and filters, check real-time availability across dates, place orders with server-calculated amounts, pay securely via Stripe, and review gear once returned.
- **Providers**: List and manage inventory, customize pricing per day, oversee rental requests, and update order lifecycles (`CONFIRMED` ➔ `PICKED_UP` ➔ `RETURNED`).
- **Admins**: Manage equipment categories, suspend/activate user accounts, inspect all platform gear and rentals, and safely remove items with active-rental protection.

---

## 🛡️ Architectural Highlights & Hardening

| Feature / Pattern | Architectural Benefit |
| :--- | :--- |
| **Concurrency-Safe Serializable Transactions** | Prevents double-booking when multiple customers reserve gear simultaneously. Runs inside Prisma `Serializable` isolation with an automatic retry loop for conflict code `P2034`. |
| **Single-Provider Order Validation** | Guarantees that every item in a rental order belongs to the same provider, preventing logistical split-shipment and deposit complications. |
| **Date-Overlap Availability Calculation** | Dynamically verifies gear stock against all overlapping active rentals: $\text{startTime} < \text{requested.endDate} \land \text{endTime} > \text{requested.startDate}$. |
| **Client & Database Idempotency** | Prevents duplicate payments on retries using client-supplied `Idempotency-Key` headers, verified database uniqueness, and Stripe API idempotency. |
| **Server-Calculated Billing & Refunds** | Total prices and refund amounts are exclusively calculated server-side from rate cards and dates—clients cannot alter monetary parameters. |
| **Verified Stripe Webhooks** | Mounted with `express.raw({ type: "application/json" })` before global JSON body parsing to guarantee cryptographic signature verification. |
| **Prisma Error Mapping (`P2002`, `P2025`, `P2003`, `P2034`)** | Custom mapper translates database constraint errors into clean HTTP status codes (`409 Conflict`, `404 Not Found`), eliminating opaque `500` server errors. |
| **Structured Pagination & Meta** | Standardized `{ data: [...], meta: { page, limit, total, totalPages } }` responses for all listing endpoints. |
| **Production Server Resilience** | Zod-validated environment config, lightweight colorized request logger, and graceful shutdown handling (`SIGINT`, `SIGTERM`, unhandled rejections) with Prisma disconnect. |

---

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (v20+ recommended)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (v5.8, Strict mode, Node ESM)
- **Web Framework**: [Express.js](https://expressjs.com/) (v5.2)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Hosted on Neon)
- **ORM**: [Prisma ORM](https://www.prisma.io/) (v7.8) with `@prisma/adapter-pg`
- **Validation**: [Zod](https://zod.dev/)
- **Payments**: [Stripe Node SDK](https://stripe.com/)
- **Security & Authentication**: `jsonwebtoken`, `bcryptjs`, `cookie-parser`, `cors`
- **Package Manager**: [pnpm](https://pnpm.io/)

---

## 📐 System Architecture Flow

```mermaid
flowchart TD
    Client(["🌐 Client (Web / Mobile)"]) -->|HTTP Request| RequestLogger["⏱️ Request Logger Middleware"]
    RequestLogger --> CorsCookie["🛡️ CORS & CookieParser"]
    
    CorsCookie --> WebhookBranch{"Route is Webhook?"}
    WebhookBranch -->|Yes /api/payments/webhook| RawBody["📦 express.raw (Buffer)"]
    WebhookBranch -->|No Standard API| JsonBody["📝 express.json()"]
    
    RawBody --> StripeWebhookHandler["🔐 Stripe Signature Verification & Handler"]
    JsonBody --> AuthCheck{"🔒 Auth Middleware"}
    
    AuthCheck -->|Public Route| Validator["📝 Zod Validation"]
    AuthCheck -->|Protected Route| RoleCheck["🔑 JWT Verification & requireRoles()"]
    RoleCheck --> Validator
    
    Validator --> Controller["🎮 Controller Layer"]
    Controller --> Service["⚙️ Service Layer (Business Rules)"]
    
    Service --> PrismaTx{"💳 Database Transaction"}
    PrismaTx -->|Rental Booking| SerializableTx["🔄 Serializable Tx + Retry Loop"]
    PrismaTx -->|Standard Query| PrismaClient["📦 Prisma Client (PostgreSQL)"]
    SerializableTx --> PrismaClient
    
    Service -->|Success| Controller -->|JSON Response| Client
    Service -.->|Error| PrismaMapper["🚨 handlePrismaError (P2002/P2025/P2034)"]
    PrismaMapper -.-> GlobalErrorHandler["🚨 Global Error Middleware"]
    GlobalErrorHandler -.->|Standard Error JSON| Client
```

---

## 🗃️ Database Schema & Models

> 📊 **Interactive ERD Diagram**:  
> Explore the full database schema, visual entity relationships, column types, and foreign key constraints on DrawSQL:  
> 🔗 [**https://drawsql.app/teams/inert-argon/diagrams/gearup**](https://drawsql.app/teams/inert-argon/diagrams/gearup)

```mermaid
erDiagram
    User ||--o{ Gear : "provides"
    User ||--o{ RentalOrder : "places (as customer)"
    User ||--o{ Review : "writes"
    User ||--o{ Payment : "makes"
    Category ||--o{ Gear : "categorizes"
    Gear ||--o{ RentalOrderItem : "included in"
    RentalOrder ||--|{ RentalOrderItem : "contains"
    RentalOrder ||--o{ Payment : "paid via"
    Gear ||--o{ Review : "receives"
```

### Models Summary:
- **`User`**: Credentials, contact information, role (`CUSTOMER`, `PROVIDER`, `ADMIN`), and account status (`ACTIVE`, `INACTIVE`, `SUSPENDED`).
- **`Category`**: Equipment classifications with unique slugs.
- **`Gear`**: Inventory owned by a Provider, with daily rate, stock count, specifications, availability toggle, and unique slug.
- **`RentalOrder`**: Booking orders with customer ID, rental period (`startTime`, `endTime`), totals, and status (`PLACED`, `CONFIRMED`, `PAID`, `PICKED_UP`, `RETURNED`, `CANCELED`).
- **`RentalOrderItem`**: Line items referencing the gear item, quantity, daily rate, duration, and line subtotal.
- **`Payment`**: Payment transaction record supporting Stripe (`currency: BDT | USD`, `status`, `idempotencyKey`, `refundId`, `refundedAt`).
- **`Review`**: Customer ratings (`1-5`) and comments for gear rented in a `RETURNED` order (strictly one review per customer per gear).

---

## 📡 Complete API Reference

**Base URL**: `http://localhost:5000/api`

### 1. Health & Base

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Root welcome message |
| `GET` | `/health` | Public | API health check status (`{"success": true, "message": "GearUp API is running"}`) |

---

### 2. Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user as `CUSTOMER` or `PROVIDER` |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive JWT access token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |

#### Register (`POST /api/auth/register`)
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "phone": "01700000000",
  "role": "CUSTOMER"
}
```

#### Login (`POST /api/auth/login`)
```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```

---

### 3. Categories (`/api/categories`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Public | List all categories with gear count |
| `GET` | `/api/categories/:id` | Public | Get single category details |
| `POST` | `/api/categories` | `ADMIN` | Create a new category |
| `PATCH` | `/api/categories/:id` | `ADMIN` | Update category details |
| `DELETE` | `/api/categories/:id` | `ADMIN` | Delete category (blocked if it contains gear) |

---

### 4. Gear Inventory (`/api/gear` & `/api/gears`)

*Both `/api/gear` and `/api/gears` routes are supported.*

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/gear` | Public | Browse gear with search, category, brand, and pagination |
| `GET` | `/api/gear/:id` | Public | Gear item details with provider, category, and `ratingSummary` |
| `POST` | `/api/gear` | `PROVIDER` | Add new gear item to inventory |
| `PATCH` | `/api/gear/:id` | `PROVIDER` | Update gear item (owner only) |
| `DELETE` | `/api/gear/:id` | `PROVIDER` | Remove gear item (blocked if rental history exists) |

#### Query Parameters for `GET /api/gear`:
- `search`: Case-insensitive search on name, brand, or description
- `categoryId`: Filter by specific category ID
- `brand`: Filter by brand name
- `isAvailable`: `"true"` or `"false"`
- `page`: Page number (default: `1`)
- `limit`: Items per page (default: `10`)

#### Create Gear (`POST /api/gear`):
```json
{
  "categoryId": "category-uuid",
  "name": "MSR Hubba Hubba 2-Person Backpacking Tent",
  "slug": "msr-hubba-hubba-2p-tent",
  "brand": "MSR",
  "description": "Ultralight freestanding 3-season tent.",
  "pricePerDay": 250.00,
  "stock": 5,
  "imageUrl": "https://example.com/tent.jpg",
  "specifications": { "weightKg": 1.72, "capacity": 2 },
  "isAvailable": true
}
```

---

### 5. Rentals & Booking (`/api/rentals`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/rentals` | `CUSTOMER` | Book rental order (concurrency-safe) |
| `GET` | `/api/rentals` | `CUSTOMER` | List personal rental order history |
| `GET` | `/api/rentals/:id` | `CUSTOMER` | View single rental order details |
| `PATCH` | `/api/rentals/:id/cancel` | `CUSTOMER` | Cancel order (only if status is `PLACED`) |

#### Create Rental Booking (`POST /api/rentals`):
```json
{
  "startDate": "2026-10-10",
  "endDate": "2026-10-12",
  "items": [
    {
      "gearItemId": "gear-uuid-1",
      "quantity": 2
    }
  ]
}
```

---

### 6. Provider Rental Management (`/api/provider/rentals`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/provider/rentals` | `PROVIDER` | List incoming rental orders for provider's gear |
| `PATCH` | `/api/provider/rentals/:id/status` | `PROVIDER` | Update order status along lifecycle transitions |

#### Status Transition Rules:
- `PLACED` ➔ `CONFIRMED`
- `PAID` ➔ `PICKED_UP`
- `PICKED_UP` ➔ `RETURNED`

---

### 7. Payments & Stripe Webhooks (`/api/payments`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/payments` | `CUSTOMER` | Initialize Stripe payment (requires `Idempotency-Key`) |
| `GET` | `/api/payments` | `CUSTOMER` | List customer's payment transactions |
| `GET` | `/api/payments/:id` | `CUSTOMER` | Get single payment record |
| `POST` | `/api/payments/:id/refund` | `CUSTOMER` | Refund payment (allowed if rental is `RETURNED` or `CANCELED`) |
| `POST` | `/api/payments/webhook` | Stripe | Webhook endpoint receiving signed Stripe events |

#### Create Payment (`POST /api/payments`):
- **Headers**: `Idempotency-Key: <unique-client-key>`
```json
{
  "rentalOrderId": "order-uuid",
  "method": "STRIPE"
}
```
- **Response** (`201 Created`):
```json
{
  "success": true,
  "message": "Payment initialized successfully",
  "data": {
    "payment": { "id": "pay-uuid", "amount": "500.00", "currency": "BDT", "status": "PENDING" },
    "clientSecret": "pi_..._secret_...",
    "reused": false
  }
}
```

#### Refund Payment (`POST /api/payments/:id/refund`):
```json
{
  "reason": "Rental returned in pristine condition"
}
```

---

### 8. Reviews (`/api/reviews`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reviews` | `CUSTOMER` | Review gear from a `RETURNED` rental |
| `GET` | `/api/reviews/gear/:gearItemId` | Public | Get paginated reviews for a gear item (`?page=1&limit=10`) |

#### Create Review (`POST /api/reviews`):
```json
{
  "rentalOrderId": "order-uuid",
  "gearItemId": "gear-uuid",
  "rating": 5,
  "comment": "Outstanding bike and pristine condition!"
}
```

---

### 9. Admin Governance (`/api/admin`)

*All `/api/admin/*` endpoints require `ADMIN` role.*

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/users` | `ADMIN` | List platform users with pagination (`?page=1&limit=10`) |
| `PATCH` | `/api/admin/users/:id/status` | `ADMIN` | Suspend or activate user (`ACTIVE` / `SUSPENDED`) |
| `GET` | `/api/admin/gear` | `ADMIN` | Overview of all gear across all providers with pagination |
| `DELETE` | `/api/admin/gear/:id` | `ADMIN` | Delete gear (blocked if it has active rentals) |
| `GET` | `/api/admin/rentals` | `ADMIN` | Comprehensive platform rental overview with payments |

---

## ⚙️ Environment Configuration

Refer to [`.env.example`](file:///Users/shuvo/Programming/Projects/GearUp/.env.example) for required variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (PostgreSQL / Neon)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=1d
SALT_ROUNDS=10

# Stripe Payment Gateway
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 💻 Getting Started (Setup with pnpm)

### Step 1: Clone the Repository
```bash
git clone https://github.com/rakibul263/GearUp-Backend.git
cd GearUp-Backend
```

### Step 2: Install Dependencies
```bash
pnpm install
```

### Step 3: Setup Environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL database and Stripe credentials
```

### Step 4: Synchronize Database Schema
```bash
# Push schema to PostgreSQL
pnpm prisma db push

# Generate Prisma Client
pnpm prisma generate
```

### Step 5: Start Development Server
```bash
pnpm dev
```
Server runs with live watch on `http://localhost:5000`.

---

## 🏗️ Project Directory Structure

```text
GearUp/
├── generated/                     # Generated Prisma client and models
│   └── prisma/
├── prisma/
│   └── schema/                   # Domain-driven modular Prisma schemas
│       ├── category.prisma
│       ├── enums.prisma
│       ├── gear.prisma
│       ├── payment.prisma
│       ├── rental.prisma
│       ├── review.prisma
│       ├── schema.prisma
│       └── user.prisma
├── scripts/
│   └── fix-esm-extensions.mjs    # Post-build ESM import specifier resolver
├── src/
│   ├── config/                   # Database client, Stripe & validated env config
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── stripe.ts
│   ├── constants/                # Payment and order constants
│   │   ├── orderStatus.ts
│   │   ├── payment.ts
│   │   └── roles.ts
│   ├── errors/
│   │   └── AppError.ts           # Re-exported AppError class
│   ├── middlewares/              # Express middlewares
│   │   ├── AppError.ts           # Custom operational error class
│   │   ├── auth.middleware.ts    # JWT token authentication
│   │   ├── error.middleware.ts   # Prisma & global error handler
│   │   ├── logger.middleware.ts  # HTTP request logger
│   │   ├── notFound.middleware.ts# 404 handler
│   │   ├── role.middleware.ts    # RBAC role authorization
│   │   └── validation.middleware.ts # Zod body & query validators
│   ├── modules/                  # Modular domain feature slices
│   │   ├── admin/                # Admin users, gear & rentals governance
│   │   ├── auth/                 # Registration, login, profile
│   │   ├── category/             # Category management
│   │   ├── gear/                 # Gear catalog & inventory
│   │   ├── payment/              # Stripe gateway, idempotency, refunds & webhooks
│   │   ├── rental/               # Rental booking & provider lifecycle
│   │   └── review/               # Post-rental gear reviews
│   ├── routes/
│   │   └── index.ts              # Master API router registry
│   ├── types/                    # Express & ambient type definitions
│   │   └── express.d.ts
│   ├── utils/                    # Shared utilities (JWT, password, pagination, prisma-error)
│   ├── app.ts                    # Express application setup
│   └── server.ts                 # HTTP server listener & graceful shutdown
├── .env.example                  # Environment configuration template
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── README.md
```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts development server with live watch mode using `tsx` |
| `pnpm build` | Compiles TypeScript (`tsc`) and resolves ESM extensions via script |
| `pnpm typecheck` | Runs TypeScript compiler checks without emitting files (`tsc --noEmit`) |
| `pnpm start` | Runs the compiled production server (`node dist/src/server.js`) |
| `pnpm prisma studio` | Launches Prisma interactive visual database studio |
| `pnpm prisma db push` | Synchronizes the Prisma schema directly with the database |
| `pnpm prisma generate` | Regenerates the Prisma Client |

---

## 🔒 Security Best Practices Implemented

- **Password Security**: Passwords are salted and hashed using `bcrypt` prior to database storage.
- **SQL Injection Prevention**: Prisma ORM executes parameterized queries for all operations.
- **Strict Role Boundaries**: Enforced at the router level via `requireRoles("CUSTOMER" | "PROVIDER" | "ADMIN")`.
- **Payment Idempotency**: Double-charging protected across client, database, and Stripe API.
- **Zero Client Price Tampering**: Subtotals, totals, and refunds calculated server-side.
- **Graceful Process Termination**: Handles `SIGTERM` and `SIGINT` with database disconnection before process exit.

---

## 📄 License

This project is licensed under the **MIT License**.
