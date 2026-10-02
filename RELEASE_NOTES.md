# Release v1.0.0 — GearUp Backend API

We are excited to announce the initial production release **v1.0.0** of **GearUp**, an enterprise-grade backend REST API for renting sports and outdoor equipment.

---

### 🌐 Live Production Links

* **Live API**: [https://gearup-backend-2.onrender.com](https://gearup-backend-2.onrender.com)
* **Interactive Swagger UI**: [https://gearup-backend-2.onrender.com/docs](https://gearup-backend-2.onrender.com/docs)
* **Raw OpenAPI 3.0 JSON**: [https://gearup-backend-2.onrender.com/api/docs/openapi.json](https://gearup-backend-2.onrender.com/api/docs/openapi.json)
* **Production Health Check**: [https://gearup-backend-2.onrender.com/health](https://gearup-backend-2.onrender.com/health)

---

### 📦 Container Registry Packages

This release is published and available across major container registries:

* **Docker Hub**:
  ```bash
  docker pull itzshuvo/gearup-api:v1.0.0
  docker pull itzshuvo/gearup-api:latest
  ```
* **GitHub Container Registry (GHCR)**:
  ```bash
  docker pull ghcr.io/rakibul263/gearup-backend:v1.0.0
  docker pull ghcr.io/rakibul263/gearup-backend:latest
  ```

---

### 🚀 Key Features & Highlights

1. **Complete RESTful Architecture (34 Endpoints)**:
   * Full documentation of all 34 API endpoints in Swagger OpenAPI 3.0 across 10 modules: Health, Auth, Categories, Gears, Rentals, Provider Rentals, Payments, Refunds, Reviews, and Admin controls.
2. **Role-Based Access Control (RBAC)**:
   * Strict separation of privileges across `CUSTOMER`, `PROVIDER`, and `ADMIN` roles powered by cryptographically signed JWT tokens and bcrypt password hashing.
3. **Zero-Double-Booking Concurrency Control**:
   * Uses serializable PostgreSQL transaction isolation with date range overlap verification to prevent inventory overselling under burst traffic.
4. **Idempotent Stripe Payments & Webhooks**:
   * Integrates Stripe PaymentIntents with client-supplied `Idempotency-Key` headers to protect against network retries and duplicate charges.
   * Cryptographic HMAC signature verification for inbound Stripe webhooks.
5. **Distributed Refund Reconciliation**:
   * Introduces a dedicated `PaymentRefund` entity with immutable audit tracking (`PENDING` -> `COMPLETED`).
   * Automated reconciliation engine comparing local database records against the Stripe API.
6. **Production Security Hardening**:
   * OWASP security headers (`CSP`, `X-Content-Type-Options`, `X-Frame-Options`, `HSTS`).
   * Tiered sliding-window rate limiters protecting authentication, payment, and public endpoints.
   * Universal correlation IDs (`X-Request-Id`) across all incoming requests and structured JSON logging.
7. **Comprehensive Automated Test Suite**:
   * 35 unit, integration, validation, and load tests executed via Node.js native test runner (`node:test`) with 100% pass rate.
8. **Multi-Stage Lean Docker Build**:
   * Built on `node:24-alpine` running as non-root unprivileged `node` user with an image size of only ~159 MB.

---

### ⚡ Quick Start

```bash
docker run -d \
  --name gearup-api \
  -p 5000:5000 \
  -e PORT=5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://user:password@host:5432/gearup_db?sslmode=require" \
  -e JWT_SECRET="your-super-secret-jwt-key-min-32-chars" \
  -e APP_BASE_URL="https://gearup-backend-2.onrender.com" \
  itzshuvo/gearup-api:latest
```

---

### 📄 Full Changelog

* Initial stable release v1.0.0.
* Multi-arch Docker images published for `linux/amd64` and `linux/arm64`.
* Production deployment configured on Render and Neon Serverless PostgreSQL.
