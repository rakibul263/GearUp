export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "GearUp API",
    version: "1.0.0",
    description:
      "Production-ready backend API for sports & outdoor gear rentals. Features multi-role authentication, optimistic inventory locking, Stripe payments, idempotent refunds, and automated admin controls.",
    contact: {
      name: "GearUp Engineering",
      url: "https://github.com/shuvomondal/GearUp",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local Development Server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your Bearer access token generated from /api/auth/login",
      },
      IdempotencyKey: {
        type: "apiKey",
        in: "header",
        name: "Idempotency-Key",
        description: "Unique idempotency key (UUID or client-generated string)",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { type: "object" },
        },
      },
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Invalid input credentials" },
        },
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 45 },
          totalPages: { type: "integer", example: 5 },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Service Health Check",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Service is healthy and responding",
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        summary: "Register new user",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password", "phone"],
                properties: {
                  name: { type: "string", example: "John Doe" },
                  email: { type: "string", format: "email", example: "john@example.com" },
                  password: { type: "string", format: "password", example: "SecurePass123!" },
                  phone: { type: "string", example: "+8801700000000" },
                  role: { type: "string", enum: ["CUSTOMER", "PROVIDER"], default: "CUSTOMER" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "User registered successfully" },
          "400": { description: "Validation error" },
          "409": { description: "User already exists with this email" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Authenticate user and get JWT access token",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "john@example.com" },
                  password: { type: "string", format: "password", example: "SecurePass123!" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful with token and profile" },
          "401": { description: "Invalid email or password" },
          "403": { description: "Account inactive or suspended" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        summary: "Get current authenticated user",
        tags: ["Auth"],
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "User profile fetched successfully" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/categories": {
      get: {
        summary: "List all categories with gear counts",
        tags: ["Categories"],
        responses: {
          "200": { description: "Categories fetched successfully" },
        },
      },
      post: {
        summary: "Create a new category (ADMIN only)",
        tags: ["Categories"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "slug"],
                properties: {
                  name: { type: "string", example: "Climbing Gear" },
                  slug: { type: "string", example: "climbing-gear" },
                  description: { type: "string", example: "Harnesses, ropes, and carabiners" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Category created successfully" },
          "403": { description: "Forbidden - Admin only" },
          "409": { description: "Category name or slug already exists" },
        },
      },
    },
    "/api/gears": {
      get: {
        summary: "List gear items with pagination & filters",
        tags: ["Gear"],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" }, description: "Search by name, description, brand" },
          { name: "categoryId", in: "query", schema: { type: "string" }, description: "Filter by category ID" },
          { name: "brand", in: "query", schema: { type: "string" }, description: "Filter by brand name" },
          { name: "isAvailable", in: "query", schema: { type: "boolean" }, description: "Filter availability" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          "200": { description: "Gears fetched successfully with pagination metadata" },
        },
      },
      post: {
        summary: "Create gear item (PROVIDER only)",
        tags: ["Gear"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["categoryId", "name", "slug", "pricePerDay", "stock"],
                properties: {
                  categoryId: { type: "string" },
                  name: { type: "string", example: "4-Season Expedition Tent" },
                  slug: { type: "string", example: "4-season-expedition-tent" },
                  description: { type: "string" },
                  brand: { type: "string", example: "The North Face" },
                  pricePerDay: { type: "number", example: 35.0 },
                  stock: { type: "integer", example: 5 },
                  imageUrl: { type: "string", format: "uri" },
                  isAvailable: { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Gear created successfully" },
          "403": { description: "Forbidden - Provider role required" },
          "409": { description: "Gear with this slug already exists" },
        },
      },
    },
    "/api/gears/{id}": {
      get: {
        summary: "Get gear details with rating summary",
        tags: ["Gear"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Gear fetched successfully" },
          "404": { description: "Gear not found" },
        },
      },
    },
    "/api/rentals": {
      get: {
        summary: "Get customer rental bookings",
        tags: ["Rentals"],
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "Rental orders fetched successfully" },
        },
      },
      post: {
        summary: "Create rental order with serializable inventory locking",
        tags: ["Rentals"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["startDate", "endDate", "items"],
                properties: {
                  startDate: { type: "string", format: "date-time", example: "2026-11-01T10:00:00Z" },
                  endDate: { type: "string", format: "date-time", example: "2026-11-05T10:00:00Z" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["gearItemId", "quantity"],
                      properties: {
                        gearItemId: { type: "string" },
                        quantity: { type: "integer", minimum: 1, example: 2 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Rental order created successfully in PLACED state" },
          "400": { description: "Validation error or multiple providers in one order" },
          "409": { description: "Insufficient stock or overlapping reservations conflict" },
        },
      },
    },
    "/api/rentals/{id}/cancel": {
      patch: {
        summary: "Cancel a PLACED rental order (CUSTOMER only)",
        tags: ["Rentals"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Rental order cancelled successfully" },
          "409": { description: "Only placed orders can be cancelled" },
        },
      },
    },
    "/api/provider/rentals": {
      get: {
        summary: "List provider's incoming rental orders",
        tags: ["Provider Rentals"],
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "Provider rental orders fetched successfully" },
        },
      },
    },
    "/api/provider/rentals/{id}/status": {
      patch: {
        summary: "Advance rental lifecycle (CONFIRMED -> PICKED_UP -> RETURNED)",
        tags: ["Provider Rentals"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["CONFIRMED", "PICKED_UP", "RETURNED"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Rental status updated successfully" },
          "409": { description: "Invalid status transition" },
        },
      },
    },
    "/api/payments": {
      post: {
        summary: "Initialize Stripe payment intent (CUSTOMER only)",
        tags: ["Payments"],
        security: [{ BearerAuth: [] }, { IdempotencyKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rentalOrderId", "method"],
                properties: {
                  rentalOrderId: { type: "string" },
                  method: { type: "string", enum: ["STRIPE"] },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Payment initialized with client secret" },
          "400": { description: "Missing Idempotency-Key header or invalid data" },
          "409": { description: "Rental not in CONFIRMED state or already paid" },
        },
      },
    },
    "/api/payments/refunds": {
      post: {
        summary: "Process partial or full payment refund with idempotency",
        tags: ["Refunds"],
        security: [{ BearerAuth: [] }, { IdempotencyKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["paymentId", "amount"],
                properties: {
                  paymentId: { type: "string" },
                  amount: { type: "number", example: 50.0 },
                  reason: { type: "string", example: "Security deposit return after inspection" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Refund processed successfully" },
          "400": { description: "Rental must be RETURNED or amount exceeds refundable balance" },
          "409": { description: "Idempotency key conflict" },
        },
      },
    },
    "/api/reviews": {
      post: {
        summary: "Submit review for returned gear (CUSTOMER only)",
        tags: ["Reviews"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rentalOrderId", "gearItemId", "rating"],
                properties: {
                  rentalOrderId: { type: "string" },
                  gearItemId: { type: "string" },
                  rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
                  comment: { type: "string", example: "Excellent equipment, pristine condition!" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Review created successfully" },
          "400": { description: "Gear must belong to a returned rental" },
          "409": { description: "Already reviewed this gear" },
        },
      },
    },
    "/api/admin/users": {
      get: {
        summary: "List all users with pagination (ADMIN only)",
        tags: ["Admin"],
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "Users fetched successfully" },
          "403": { description: "Forbidden - Admin only" },
        },
      },
    },
    "/api/admin/users/{id}/status": {
      patch: {
        summary: "Update user status ACTIVE or SUSPENDED (ADMIN only)",
        tags: ["Admin"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["ACTIVE", "SUSPENDED"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "User status updated successfully" },
          "403": { description: "Cannot change Admin status" },
        },
      },
    },
  },
};
