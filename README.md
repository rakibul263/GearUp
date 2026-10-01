# 🏕️ GearUp — Outdoor & Sports Gear Rental Backend API

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.8-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5.2-black.svg?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-v7.8-2D3748.svg?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![pnpm](https://img.shields.io/badge/pnpm-v9+-F69220.svg?style=for-the-badge&logo=pnpm)](https://pnpm.io/)
[![DrawSQL ERD](https://img.shields.io/badge/ERD-DrawSQL-2563EB.svg?style=for-the-badge)](https://drawsql.app/teams/inert-argon/diagrams/gearup)
[![License](https://img.shields.io/badge/license-MIT-purple.svg?style=for-the-badge)](#license)

**GearUp** is a peer-to-peer rental marketplace backend designed for renting outdoor, camping, sports, and adventure equipment. It connects equipment **Providers** with adventure-seeking **Customers**, providing real-time inventory management, concurrency-safe booking, flexible search and filtering, and role-based access control.

---

## 📑 Table of Contents

- [Project Overview](#-project-overview)
- [Unique & Key Features](#-unique--key-features)
- [Architecture & Design Rationale (কি ও কেন করা হয়েছে)](#-architecture--design-rationale-কি-ও-কেন-করা-হয়েছে)
- [Tech Stack](#-tech-stack)
- [System Architecture Flow](#-system-architecture-flow)
- [Database Schema & Models](#-database-schema--models)
- [API Reference](#-api-reference)
  - [Health & Base](#1-health--base)
  - [Authentication (`/api/auth`)](#2-authentication-apiauth)
  - [Categories (`/api/categories`)](#3-categories-apicategories)
  - [Gear Inventory (`/api/gears`)](#4-gear-inventory-apigears)
  - [Rentals & Booking (`/api/rentals`)](#5-rentals--booking-apirentals)
  - [Provider Rentals (`/api/provider/rentals`)](#6-provider-rental-management-apiproviderrentals)
- [Getting Started (Setup with pnpm)](#-getting-started-setup-with-pnpm)
- [Project Directory Structure](#-project-directory-structure)
- [Available Scripts](#-available-scripts)

---

## 🌟 Project Overview

Outdoor gear is expensive, infrequently used, and space-consuming. GearUp provides the backend engine to rent high-quality gear sustainably:
- **Customers**: Browse equipment with rich filters, verify real-time availability for custom date ranges, place rental reservations, and manage orders.
- **Providers**: List gear, configure pricing per day, manage inventory stock, and track rental histories safely.
- **Admins**: Maintain equipment categories and monitor platform activity.

---

## 🚀 Unique & Key Features

### 1. 🛡️ Concurrency-Safe Booking with Serializable Transactions
- Prevents **double-booking** when multiple customers attempt to rent the same equipment stock simultaneously.
- Runs inside a Prisma transaction with **`Serializable` isolation level**.
- Automatic retry loop (up to 3 attempts) handling database serialization collisions (`P2034`), ensuring zero stock discrepancies under heavy concurrent traffic.

### 2. 📦 Single-Provider Rental Order Constraint
- Each rental order is strictly validated to ensure all requested items belong to a **single provider**.
- Eliminates split-fulfillment logistics failures, simplifies shipping/pickup schedules, and maintains clear accountability per order.

### 3. 📅 Date-Overlap Stock Availability Calculation
- Verifies available stock dynamically across all overlapping active orders:
  $$\text{Overlap Condition: } \text{Order.startTime} < \text{Requested.endDate} \quad \text{AND} \quad \text{Order.endTime} > \text{Requested.startDate}$$
- Filters only active rental orders (`PLACED`, `CONFIRMED`, `PAID`, `PICKED_UP`), accurately calculating:
  $$\text{Available Stock} = \text{Gear.stock} - \sum \text{Reserved Quantities}$$

### 4. 🔐 Dual-Channel Authentication & Role-Based Access Control (RBAC)
- Supports both **HTTP-Only Cookies** and **`Authorization: Bearer <token>`** headers.
- Strict authorization gates:
  - `CUSTOMER`: Book rentals, view personal orders, cancel pending reservations.
  - `PROVIDER`: Create, edit, and delete their own gear (guarded against deleting items with rental history).
  - `ADMIN`: Manage gear categories and global configurations.

### 5. 🗄️ Multi-File Domain-Driven Prisma Schema
- Prisma schema is decoupled into logical domain files under `prisma/schema/` (`user.prisma`, `gear.prisma`, `rental.prisma`, `category.prisma`, `payment.prisma`, `review.prisma`, `enums.prisma`).

### 6. ⚡ Strict Runtime Validation & Error Handling
- Every incoming payload (body, query, params) is validated using **Zod schemas** before reaching controller logic.
- Consistent API responses and standardized HTTP error structures via a custom `AppError` class.

---

## 🧠 Architecture & Design Rationale (কি ও কেন করা হয়েছে)

| Architectural Decision | Why It Was Implemented (কেন করা হয়েছে) |
| :--- | :--- |
| **Layered Architecture (`Route` → `Controller` → `Service` → `Database`)** | Clean separation of concerns. Controllers handle HTTP request/response parsing; services contain pure business logic and transactions; routes handle middleware binding. Easy to test and maintain. |
| **Serializable Transactions for Rentals** | Default `Read Committed` isolation allows race conditions where two simultaneous requests can see the same stock and overbook. `Serializable` guarantees strict sequential validity. |
| **Transaction Retry Loop (`P2034`)** | In Postgres, `Serializable` transactions may throw concurrency conflict errors when transactions serialize. A retry loop with backoff transparently recovers without failing user requests. |
| **Single-Provider Order Rule** | If a customer orders 3 items from 3 different providers across different locations, pickup/delivery and deposit handling become logistical nightmares. Constraining an order to one provider guarantees clean fulfillment. |
| **Prisma Multi-Schema Files** | Monolithic `schema.prisma` files grow messy in large projects. Splitting into domain models keeps entities clear, modular, and maintainable. |
| **Express 5.x + Native Node ESM** | Uses modern ECMAScript modules (`"type": "module"`) with `.js` extensions, leveraging native performance and modern JavaScript features. |
| **Zod for Validation** | Ensures end-to-end type inference between validation schemas and TypeScript types, eliminating duplicate interface declarations. |
| **Centralized `AppError` & Error Middleware** | Removes repetitive `try/catch` boilerplate in controllers. Errors carry HTTP status codes, operational flags, and structured messages. |

---

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (v20+ recommended)
- **Package Manager**: [pnpm](https://pnpm.io/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode, ESM)
- **Web Framework**: [Express.js](https://expressjs.com/) (v5.x)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma ORM](https://www.prisma.io/) with `@prisma/adapter-pg`
- **Validation**: [Zod](https://zod.dev/)
- **Security & Authentication**:
  - `jsonwebtoken` (JWT creation & verification)
  - `bcryptjs` / `bcrypt` (password hashing)
  - `cookie-parser` (HTTP-only cookie extraction)
  - `cors` (Cross-Origin Resource Sharing)
- **Developer Tools**: `tsx` (live watch runner), `typescript` compiler

---

## 📐 System Architecture Flow

```mermaid
flowchart TD
    Client(["🌐 Client (Web / Mobile)"]) -->|HTTP Request| Middleware["🛡️ Middlewares\n(CORS, CookieParser, JSON)"]
    Middleware --> AuthCheck{"🔒 Auth Middleware"}
    
    AuthCheck -->|Public Route| Validator["📝 Zod Validation Middleware"]
    AuthCheck -->|Protected Route| VerifyJWT["🔑 JWT Token Verification\n& Role Check (RBAC)"]
    VerifyJWT --> Validator
    
    Validator --> Controller["🎮 Controller Layer\n(Request/Response Format)"]
    Controller --> Service["⚙️ Service Layer\n(Business Logic & Rules)"]
    
    Service --> Transaction{"💳 Database Operation"}
    Transaction -->|Rental Booking| SerializableTx["🔄 Serializable Transaction\n+ Concurrency Conflict Retry Loop"]
    Transaction -->|Standard Query| PrismaClient["📦 Prisma Client (PostgreSQL)"]
    SerializableTx --> PrismaClient
    
    PrismaClient --> Postgres[(🐘 PostgreSQL Database)]
    
    Service -->|Success / Throws AppError| Controller
    Controller -->|JSON Response| Client
    Service -.->|Error| ErrorHandler["🚨 Global Error Middleware"]
    ErrorHandler -.->|Standardized Error JSON| Client
```

---

## 🗃️ Database Schema & Models

> 📊 **Interactive ERD Diagram**:  
> Explore the full database schema, visual entity relationships, column types, and foreign key constraints on DrawSQL:  
> 🔗 [**https://drawsql.app/teams/inert-argon/diagrams/gearup**](https://drawsql.app/teams/inert-argon/diagrams/gearup)

### Core Entities & Relationships:

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
- **`User`**: Customer, Provider, or Admin. Stores credentials, contact info, role (`CUSTOMER`, `PROVIDER`, `ADMIN`), and status.
- **`Category`**: Hierarchical classification for gears (e.g., Tents, Hiking, Climbing, Winter Sports).
- **`Gear`**: Inventory items owned by a Provider, with pricing per day, stock count, specifications, and availability toggle.
- **`RentalOrder`**: Booking orders with customer ID, rental period (`startTime`, `endTime`), totals, and status (`PLACED`, `CONFIRMED`, `PAID`, `PICKED_UP`, `RETURNED`, `CANCELED`).
- **`RentalOrderItem`**: Line items inside a rental order referencing the gear item, quantity, daily rate, duration, and line subtotal.
- **`Payment`**: Payment transaction record supporting Stripe
- **`Review`**: Customer ratings and comments on gear.

---

## 📡 API Reference

**Base URL**: `http://localhost:5000/api`

### 1. Health & Base

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Root welcome message |
| `GET` | `/health` | Public | Healthcheck endpoint (`status: success`) |

---

### 2. Authentication (`/api/auth`)

#### Register a New User
- **Endpoint**: `POST /api/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "phone": "01700000000",
  "role": "CUSTOMER" // "CUSTOMER" or "PROVIDER"
}
```
- **Response** (`201 Created`):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "c8f1e2a0-...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "CUSTOMER",
      "status": "ACTIVE"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login User
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```
- **Response** (`200 OK`): Sets HTTP-only `token` cookie and returns user object with JWT token.

#### Get Current Authenticated User
- **Endpoint**: `GET /api/auth/me`
- **Access**: Authenticated (`CUSTOMER`, `PROVIDER`, `ADMIN`)
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Response** (`200 OK`): Profile of the logged-in user.

---

### 3. Categories (`/api/categories`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Public | List all categories with item counts |
| `GET` | `/api/categories/:id` | Public | Get single category details |
| `POST` | `/api/categories` | `ADMIN` | Create a new category |
| `PATCH` | `/api/categories/:id` | `ADMIN` | Update category name/slug/description |
| `DELETE`| `/api/categories/:id` | `ADMIN` | Delete category (blocked if it contains gear) |

#### Create Category Example (`POST /api/categories`)
```json
{
  "name": "Camping & Hiking",
  "slug": "camping-hiking",
  "description": "Tents, sleeping bags, backpacks, and camping stoves"
}
```

---

### 4. Gear Inventory (`/api/gears`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/gears` | Public | Browse gear with search, category, brand, and pagination |
| `GET` | `/api/gears/:id` | Public | Get gear item details with provider and category |
| `POST` | `/api/gears` | `PROVIDER` | Add new gear item to inventory |
| `PATCH` | `/api/gears/:id` | `PROVIDER` | Update gear item (owner only) |
| `DELETE`| `/api/gears/:id` | `PROVIDER` | Remove gear item (blocked if rental history exists) |

#### Query Parameters for `GET /api/gears`:
- `search`: Search by name, brand, or description
- `categoryId`: Filter by specific category ID
- `brand`: Filter by brand name
- `isAvailable`: `"true"` or `"false"`
- `page`: Page number (default: `1`)
- `limit`: Items per page (default: `10`)

#### Create Gear Example (`POST /api/gears`)
```json
{
  "categoryId": "category-uuid",
  "name": "MSR Hubba Hubba 2-Person Backpacking Tent",
  "slug": "msr-hubba-hubba-2p-tent",
  "brand": "MSR",
  "description": "Ultralight, freestanding 3-season tent for backpacking.",
  "pricePerDay": 25.00,
  "stock": 5,
  "imageUrl": "https://example.com/images/tent.jpg",
  "specifications": {
    "capacity": 2,
    "weightKg": 1.72,
    "waterproofRatingMm": 3000
  },
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
| `PATCH` | `/api/rentals/:id/cancel` | `CUSTOMER` | Cancel an order (only if status is `PLACED`) |

#### Create Rental Booking (`POST /api/rentals`)
```json
{
  "startDate": "2026-10-10T10:00:00.000Z",
  "endDate": "2026-10-15T10:00:00.000Z",
  "items": [
    {
      "gearItemId": "gear-uuid-1",
      "quantity": 2
    },
    {
      "gearItemId": "gear-uuid-2",
      "quantity": 1
    }
  ]
}
```

- **Validation & Business Rules Applied**:
  - `endDate` must be strictly after `startDate`.
  - Duration must be at least 1 full day.
  - All items must belong to the **same provider**.
  - Gear items must be marked `isAvailable: true`.
  - Available stock is calculated across all overlapping active orders.
  - Subtotal is computed as: $\sum (\text{pricePerDay} \times \text{quantity} \times \text{numberOfDays})$.
  - Executes inside a `Serializable` transaction with conflict retry recovery.

- **Response** (`201 Created`):
```json
{
  "success": true,
  "message": "Rental order created successfully",
  "data": {
    "id": "order-uuid",
    "customerId": "user-uuid",
    "startTime": "2026-10-10T10:00:00.000Z",
    "endTime": "2026-10-15T10:00:00.000Z",
    "subtotal": "250.00",
    "totalAmount": "250.00",
    "status": "PLACED",
    "rentalItems": [
      {
        "id": "item-uuid",
        "gearItemId": "gear-uuid-1",
        "quantity": 2,
        "pricePerDay": "25.00",
        "numberOfDays": 5,
        "subTotal": "250.00",
        "gearItem": {
          "id": "gear-uuid-1",
          "name": "MSR Hubba Hubba 2-Person Backpacking Tent",
          "pricePerDay": "25.00"
        }
      }
    ]
  }
}
---

### 6. Provider Rental Management (`/api/provider/rentals`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/provider/rentals` | `PROVIDER` | List all incoming orders for the provider's gear |
| `PATCH` | `/api/provider/rentals/:id/status` | `PROVIDER` | Update order status along permitted transitions |

#### Status Transition Rules:
- `PLACED` ➔ `CONFIRMED`
- `PAID` ➔ `PICKED_UP`
- `PICKED_UP` ➔ `RETURNED`

#### Update Rental Status Example (`PATCH /api/provider/rentals/:id/status`):
```json
{
  "status": "CONFIRMED"
}
```

---

## 💻 Getting Started (Setup with pnpm)

### Prerequisites
- [Node.js](https://nodejs.org/) `>= 20.0.0`
- [pnpm](https://pnpm.io/) `>= 9.0.0` (Install via `npm install -g pnpm`)
- [PostgreSQL](https://www.postgresql.org/) database running locally or hosted (Supabase, Neon, etc.)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/rakibul263/GearUp-Backend.git
cd GearUp-Backend
```

### Step 2: Install Dependencies with pnpm
```bash
pnpm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/gearup?schema=public"
JWT_SECRET="super_secret_jwt_key_change_me_in_production"
JWT_EXPIRES_IN="7d"
SALT_ROUNDS=10
```

### Step 4: Database Setup & Prisma Generation
Push the multi-file schema to your PostgreSQL database and generate the Prisma Client:
```bash
# Push schema directly to database
pnpm prisma db push

# Generate Prisma Client
pnpm prisma generate
```

### Step 5: Run the Development Server
```bash
pnpm dev
```
The server will boot with live reload at `http://localhost:5000`.

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
│   └── fix-esm-extensions.mjs    # Post-build ESM import specifier fixer
├── src/
│   ├── config/                   # Database client & environment config
│   │   ├── database.ts
│   │   └── env.ts
│   ├── constants/                # Enums, roles, and order statuses
│   │   ├── orderStatus.ts
│   │   └── roles.ts
│   ├── middlewares/              # Express middlewares
│   │   ├── AppError.ts           # Standardized application error class
│   │   ├── auth.middleware.ts    # JWT authentication middleware
│   │   ├── error.middleware.ts   # Global error handling middleware
│   │   ├── notFound.middleware.ts
│   │   ├── role.middleware.ts    # RBAC role verification
│   │   └── validation.middleware.ts # Zod body and query validators
│   ├── modules/                  # Feature modules
│   │   ├── auth/                 # Authentication & authorization
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.route.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.validation.ts
│   │   ├── category/             # Category management
│   │   │   ├── category.controller.ts
│   │   │   ├── category.route.ts
│   │   │   ├── category.service.ts
│   │   │   └── category.validation.ts
│   │   ├── gear/                 # Gear catalog & inventory
│   │   │   ├── gear.controller.ts
│   │   │   ├── gear.route.ts
│   │   │   ├── gear.service.ts
│   │   │   └── gear.validation.ts
│   │   └── rental/               # Rental booking & orders
│   │       ├── rental.controller.ts
│   │       ├── rental.route.ts
│   │       ├── rental.service.ts
│   │       └── rental.validation.ts
│   ├── routes/
│   │   └── index.ts              # Master API router registry
│   ├── types/                    # Ambient & Express type declarations
│   ├── utils/                    # Shared utility helpers (JWT, dates, pagination)
│   ├── app.ts                    # Express app initialization
│   └── server.ts                 # HTTP server listener
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

---

## 🔒 Security Best Practices Implemented

- **Password Security**: Passwords are salted and hashed using `bcrypt` prior to storage.
- **SQL Injection Prevention**: Prisma ORM executes parameterized queries for all operations.
- **Type Safety**: Full-stack TypeScript enforcement prevents null reference and missing field runtime errors.
- **Strict Role Boundaries**: Enforced at the router level via `requireRoles(...)`.
- **CORS Protection**: Configured to restrict or allow authorized client domains.

---

## 📄 License

This project is licensed under the **MIT License**.
