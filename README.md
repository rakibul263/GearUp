# GearUp — Rent Sports & Outdoor Gear Instantly

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.8-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5.2-black.svg?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-v7.8-2D3748.svg?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![DrawSQL ERD](https://img.shields.io/badge/ERD-DrawSQL-2563EB.svg?style=for-the-badge)](https://drawsql.app/teams/inert-argon/diagrams/gearup)

GearUp is a backend API for renting sports and outdoor equipment.

Customers can browse gear, create rental orders, make payments, track rental status, and review returned gear.

Providers can manage their inventory and process incoming rental orders.

Admins can manage users, gear, categories, and rentals.

> 📊 **Interactive ERD Diagram**:  
> Explore the full database schema, visual entity relationships, and column types on DrawSQL:  
> 🔗 [**https://drawsql.app/teams/inert-argon/diagrams/gearup**](https://drawsql.app/teams/inert-argon/diagrams/gearup)

---

## Tech Stack

* Node.js
* TypeScript
* Express
* Prisma ORM
* PostgreSQL (Neon PostgreSQL)
* JWT Authentication
* Zod Validation
* Stripe
* SSLCommerz
* pnpm

---

## Architecture

GearUp follows a layered MVC-style architecture:

```text
Request
   ↓
Route
   ↓
Middleware
   ↓
Controller
   ↓
Service
   ↓
Prisma
   ↓
Neon PostgreSQL
```

### Responsibilities

#### Route
Defines the API endpoint and middleware chain.

#### Middleware
Handles authentication, authorization, validation, request logging, and global errors.

#### Controller
Handles HTTP request/response only. Controllers should not contain business logic.

#### Service
Contains business rules and application logic.

#### Prisma
Handles database access and relational operations.

---

## Project Structure

```text
gearup/
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   ├── database.ts
│   │   └── stripe.ts
│   │
│   ├── constants/
│   │   ├── roles.ts
│   │   ├── orderStatus.ts
│   │   └── payment.ts
│   │
│   ├── errors/
│   │   └── AppError.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── logger.middleware.ts
│   │   ├── notFound.middleware.ts
│   │   └── error.middleware.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── category/
│   │   ├── gear/
│   │   ├── rental/
│   │   ├── payment/
│   │   ├── review/
│   │   └── admin/
│   │
│   ├── routes/
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── pagination.ts
│   │   ├── date.ts
│   │   └── prisma-error.ts
│   │
│   ├── types/
│   │   └── express.d.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── prisma/
│   ├── schema/
│   │   ├── schema.prisma
│   │   ├── enums.prisma
│   │   ├── user.prisma
│   │   ├── category.prisma
│   │   ├── gear.prisma
│   │   ├── rental.prisma
│   │   ├── payment.prisma
│   │   └── review.prisma
│   │
│   └── migrations/
│
├── prisma.config.ts
├── .env
├── .env.example
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── README.md
```

---

## Requirements

Make sure these are installed:

* Node.js (v20+)
* pnpm (v9+)
* PostgreSQL-compatible database (GearUp uses Neon PostgreSQL)

---

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/rakibul263/GearUp-Backend.git
cd GearUp-Backend
pnpm install
```

---

## Environment Variables

Create a `.env` file using `.env.example` as a template:

```env
PORT=5000

DATABASE_URL="your-neon-database-url"

JWT_SECRET="replace-with-a-long-random-secret-at-least-32-characters"
JWT_EXPIRES_IN="7d"

STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

SSLCOMMERZ_STORE_ID=""
SSLCOMMERZ_STORE_PASSWORD=""
SSLCOMMERZ_IS_LIVE=false

APP_BASE_URL="http://localhost:5000"
```

Never commit `.env` to Git.

---

## Database Setup

Validate the Prisma schema:

```bash
pnpm prisma:validate
```

Generate Prisma Client:

```bash
pnpm prisma:generate
```

Push schema or run migrations:

```bash
pnpm prisma db push
```

For a named migration:

```bash
pnpm prisma:migrate
```

---

## Development

Start the development server:

```bash
pnpm dev
```

The API will run on:

```text
http://localhost:5000
```

Health check:

```http
GET /health
```

---

# Authentication

GearUp uses JWT Bearer authentication.

Send the access token using:

```http
Authorization: Bearer ACCESS_TOKEN
```

Example:

```http
GET /api/auth/me
Authorization: Bearer eyJ...
```

---

# User Roles

GearUp has three roles:

```text
CUSTOMER
PROVIDER
ADMIN
```

### CUSTOMER
* Register & Login
* Browse gear with search & filters
* Create rentals
* View own rentals & cancel eligible rentals
* Make payments with client idempotency
* View payment history & request refunds
* Review returned gear

### PROVIDER
* Register & Login
* Create gear inventory
* Update & delete own gear
* View incoming rental orders
* Update rental lifecycle status (`CONFIRMED`, `PICKED_UP`, `RETURNED`)

### ADMIN
* Manage users & toggle account status (`ACTIVE` / `SUSPENDED`)
* View all gear across providers & delete inactive gear
* View all platform rentals & payment history
* Manage gear categories

---

# Rental Lifecycle

Normal rental flow:

```text
PLACED
   ↓
CONFIRMED
   ↓
PAID
   ↓
PICKED_UP
   ↓
RETURNED
```

Cancellation:

```text
PLACED
   ↓
CANCELED
```

Invalid state transitions are rejected by the rental service.

---

# API Endpoints

## Authentication

### Register
```http
POST /api/auth/register
```

### Login
```http
POST /api/auth/login
```

### Current User
```http
GET /api/auth/me
```

---

## Categories

### Public
```http
GET /api/categories
GET /api/categories/:id
```

### Admin
```http
POST /api/categories
PATCH /api/categories/:id
DELETE /api/categories/:id
```

---

## Gear

### Public
```http
GET /api/gear
GET /api/gear/:id
```

Supported filters include:
```text
search
categoryId
brand
isAvailable
page
limit
```

Example:
```http
GET /api/gear?search=camera&page=1&limit=12
```

### Provider
```http
POST /api/gear
PATCH /api/gear/:id
DELETE /api/gear/:id
```

A provider can only modify their own gear.

---

## Rentals

### Customer
```http
POST /api/rentals
GET /api/rentals
GET /api/rentals/:id
PATCH /api/rentals/:id/cancel
```

### Provider
```http
GET /api/provider/rentals
PATCH /api/provider/rentals/:id/status
```

---

## Payments

### Customer
```http
POST /api/payments
GET /api/payments
GET /api/payments/:id
POST /api/payments/:id/refund
```

Payment creation requires an idempotency key:
```http
Idempotency-Key: unique-client-generated-key
```

Supported methods:
```text
STRIPE
```

Payment amount is calculated from the rental order on the server. Clients cannot provide their own payment amount.

---

## Payment Webhooks

Stripe:
```http
POST /api/payments/stripe/webhook
```
or
```http
POST /api/payments/webhook
```

Payment completion is determined by verified gateway events rather than trusting the frontend success response.

---

## Reviews

### Create Review
```http
POST /api/reviews
```

Customer can review gear only when the associated rental has reached:
```text
RETURNED
```

### Gear Reviews
```http
GET /api/reviews/gear/:gearItemId
```

Reviews support pagination (`?page=1&limit=10`).

---

## Admin

### Users
```http
GET /api/admin/users
PATCH /api/admin/users/:id/status
```

### Gear
```http
GET /api/admin/gear
DELETE /api/admin/gear/:id
```

### Rentals
```http
GET /api/admin/rentals
```

Admin endpoints require:
```text
Authorization: Bearer ADMIN_ACCESS_TOKEN
```

---

# Pagination

Paginated endpoints use:
```text
?page=1&limit=20
```

Example response:
```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

# Error Response

Errors follow a consistent format:

```json
{
  "success": false,
  "message": "Something went wrong"
}
```

Common HTTP statuses:
```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error
```

---

# Important Business Rules

### Rental Pricing
The backend calculates:
```text
pricePerDay × quantity × numberOfDays
```
The client cannot control the final rental amount.

### Stock
A rental cannot be created when requested quantity exceeds available stock.

### Availability
Gear must be available for rental (`isAvailable: true`).

### Rental Overlap
The system checks overlapping active rentals inside a serializable transaction before creating a new order.

### Provider Ownership
Providers can only modify their own gear and process rentals containing their gear.

### Single-Provider Orders
A rental order can only contain items from a single provider to ensure seamless fulfillment.

### Reviews
A customer can review a gear item only after returning it.

### Duplicate Reviews
A customer can review a particular gear item only once.

### Suspended Users
Suspended users cannot successfully log in.

---

# Useful Commands

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts development server with live watch mode using `tsx` |
| `pnpm typecheck` | Runs TypeScript compiler checks without emitting files (`tsc --noEmit`) |
| `pnpm build` | Compiles TypeScript and resolves ESM specifiers |
| `pnpm start` | Runs the compiled server using `tsx src/server.ts` |
| `pnpm prisma:validate` | Validates Prisma multi-file schemas |
| `pnpm prisma:generate` | Generates the typed Prisma Client |
| `pnpm prisma:migrate` | Runs Prisma development migrations |
| `pnpm prisma:studio` | Launches Prisma interactive visual database studio |

---

# Production Considerations

Before production deployment:
* Use strong, random JWT secrets (minimum 32 characters).
* Configure production CORS origins.
* Configure Stripe webhook signing secrets.
* Never expose `.env` in source control.
* Run Prisma migrations as part of deployment pipelines.
* Enable structured request logging.
* Automated E2E integration test suite for verification.
* Graceful shutdown ensures in-flight requests finish cleanly and database connections close.

---

# License

This project is licensed under the **MIT License**.
