export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "GearUp API",
    version: "1.0.0",
    description:
      "Enterprise-grade backend REST API for renting sports and outdoor equipment. Built with Node.js 24, TypeScript (strict mode), Express 5, Prisma ORM, and PostgreSQL. Features multi-role authentication (CUSTOMER, PROVIDER, ADMIN), serializable concurrency inventory locking, Stripe payment intents, idempotent refund reconciliation, sliding-window rate limiting, and OWASP security hardening.",
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
  tags: [
    { name: "Health", description: "Liveness and operational health probes" },
    { name: "Auth", description: "Authentication, registration, and user profiles" },
    { name: "Categories", description: "Gear category management and public directory" },
    { name: "Gears", description: "Sports and outdoor gear inventory management" },
    { name: "Rentals", description: "Customer rental bookings and cancellations" },
    { name: "Provider Rentals", description: "Provider order processing and lifecycle transitions" },
    { name: "Payments", description: "Stripe payment intents, history, and webhook processing" },
    { name: "Refunds", description: "Idempotent payment refunds and reconciliation" },
    { name: "Reviews", description: "Customer ratings and feedback on returned gear" },
    { name: "Admin", description: "Platform governance, user management, and audit controls" },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT access token obtained from `/api/auth/login`. Example: `Bearer eyJhbGciOi...`",
      },
      IdempotencyKey: {
        type: "apiKey",
        in: "header",
        name: "Idempotency-Key",
        description: "Unique UUID or client idempotency token preventing duplicate operations on payments and refunds.",
      },
      StripeSignature: {
        type: "apiKey",
        in: "header",
        name: "stripe-signature",
        description: "Stripe HMAC signature header verifying authenticity of inbound webhook events.",
      },
    },
    schemas: {
      ApiSuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Operation completed successfully" },
          data: { type: "object" },
        },
      },
      ApiPaginatedResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Items fetched successfully" },
          data: { type: "array", items: { type: "object" } },
          meta: { $ref: "#/components/schemas/PaginationMeta" },
        },
      },
      ApiErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "An error occurred processing the request" },
          errors: {
            type: "array",
            items: { type: "object" },
            example: [{ field: "email", message: "Invalid email format" }],
          },
        },
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 42 },
          totalPages: { type: "integer", example: 5 },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "usr_ck890xyz123" },
          name: { type: "string", example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          phone: { type: "string", example: "+8801700000000" },
          role: { type: "string", enum: ["CUSTOMER", "PROVIDER", "ADMIN"], example: "CUSTOMER" },
          status: { type: "string", enum: ["ACTIVE", "SUSPENDED"], example: "ACTIVE" },
          createdAt: { type: "string", format: "date-time", example: "2026-10-01T10:00:00.000Z" },
          updatedAt: { type: "string", format: "date-time", example: "2026-10-01T10:00:00.000Z" },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string", example: "cat_ck890abc456" },
          name: { type: "string", example: "Camping & Hiking" },
          slug: { type: "string", example: "camping-hiking" },
          description: { type: "string", example: "Tents, sleeping bags, stoves, and trekking poles" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          _count: {
            type: "object",
            properties: {
              gears: { type: "integer", example: 14 },
            },
          },
        },
      },
      Gear: {
        type: "object",
        properties: {
          id: { type: "string", example: "gear_ck890def789" },
          categoryId: { type: "string", example: "cat_ck890abc456" },
          providerId: { type: "string", example: "usr_ck890xyz123" },
          name: { type: "string", example: "MSR Hubba Hubba 2-Person Tent" },
          slug: { type: "string", example: "msr-hubba-hubba-2-person-tent" },
          description: { type: "string", example: "Lightweight 3-season backpacking tent in mint condition." },
          brand: { type: "string", example: "MSR" },
          pricePerDay: { type: "number", example: 25.5 },
          stock: { type: "integer", example: 4 },
          imageUrl: { type: "string", format: "uri", example: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4" },
          isAvailable: { type: "boolean", example: true },
          averageRating: { type: "number", example: 4.8 },
          reviewCount: { type: "integer", example: 12 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          category: { $ref: "#/components/schemas/Category" },
          provider: { $ref: "#/components/schemas/User" },
        },
      },
      RentalOrderItem: {
        type: "object",
        properties: {
          id: { type: "string", example: "roi_ck890item001" },
          rentalOrderId: { type: "string", example: "ord_ck890ord999" },
          gearItemId: { type: "string", example: "gear_ck890def789" },
          quantity: { type: "integer", example: 1 },
          unitPrice: { type: "number", example: 25.5 },
          subtotal: { type: "number", example: 76.5 },
          gear: { $ref: "#/components/schemas/Gear" },
        },
      },
      RentalOrder: {
        type: "object",
        properties: {
          id: { type: "string", example: "ord_ck890ord999" },
          customerId: { type: "string", example: "usr_customer01" },
          providerId: { type: "string", example: "usr_provider01" },
          startDate: { type: "string", format: "date-time", example: "2026-11-01T10:00:00.000Z" },
          endDate: { type: "string", format: "date-time", example: "2026-11-04T10:00:00.000Z" },
          totalDays: { type: "integer", example: 3 },
          totalAmount: { type: "number", example: 76.5 },
          status: {
            type: "string",
            enum: ["PLACED", "CONFIRMED", "PICKED_UP", "RETURNED", "CANCELLED"],
            example: "PLACED",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/RentalOrderItem" },
          },
          customer: { $ref: "#/components/schemas/User" },
          provider: { $ref: "#/components/schemas/User" },
        },
      },
      Payment: {
        type: "object",
        properties: {
          id: { type: "string", example: "pay_ck890pay111" },
          rentalOrderId: { type: "string", example: "ord_ck890ord999" },
          userId: { type: "string", example: "usr_customer01" },
          amount: { type: "number", example: 76.5 },
          currency: { type: "string", enum: ["USD", "BDT", "EUR"], example: "USD" },
          status: {
            type: "string",
            enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"],
            example: "COMPLETED",
          },
          method: { type: "string", enum: ["STRIPE", "SSLCOMMERZ"], example: "STRIPE" },
          providerPaymentId: { type: "string", example: "pi_3MtwBwLkdIwHu7ix28a3tqPa" },
          clientSecret: { type: "string", example: "pi_3MtwBwLkdIwHu7ix28a3tqPa_secret_..." },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          refunds: {
            type: "array",
            items: { $ref: "#/components/schemas/PaymentRefund" },
          },
        },
      },
      PaymentRefund: {
        type: "object",
        properties: {
          id: { type: "string", example: "ref_ck890ref222" },
          paymentId: { type: "string", example: "pay_ck890pay111" },
          userId: { type: "string", example: "usr_customer01" },
          amount: { type: "number", example: 25.0 },
          currency: { type: "string", example: "USD" },
          reason: { type: "string", example: "Early return partial refund" },
          status: {
            type: "string",
            enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
            example: "COMPLETED",
          },
          providerRefundId: { type: "string", example: "re_3MtwBwLkdIwHu7ix28a3tqPa" },
          idempotencyKey: { type: "string", example: "idem-refund-uuid-1234" },
          refundedAt: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Review: {
        type: "object",
        properties: {
          id: { type: "string", example: "rev_ck890rev333" },
          rentalOrderId: { type: "string", example: "ord_ck890ord999" },
          gearItemId: { type: "string", example: "gear_ck890def789" },
          customerId: { type: "string", example: "usr_customer01" },
          rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
          comment: { type: "string", example: "Great tent, weather-tight and easy setup!" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          customer: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string", example: "John Doe" },
            },
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Service health probe",
        description: "Returns operational health status. Used by Docker orchestrators and load balancers.",
        responses: {
          "200": {
            description: "Service is healthy and accepting traffic",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "GearUp API is running" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register new user",
        description: "Creates a new user account with role CUSTOMER or PROVIDER.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password", "phone"],
                properties: {
                  name: { type: "string", minLength: 2, maxLength: 100, example: "Alex Mercer" },
                  email: { type: "string", format: "email", example: "alex@gearup.io" },
                  password: { type: "string", minLength: 6, example: "Password123!" },
                  phone: { type: "string", minLength: 6, example: "+8801711223344" },
                  role: { type: "string", enum: ["CUSTOMER", "PROVIDER"], default: "CUSTOMER", example: "CUSTOMER" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "User registered successfully." },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation failure (invalid email, short password, etc.)",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorResponse" } } },
          },
          "409": {
            description: "User already exists with this email address",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorResponse" } } },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Authenticate user and issue JWT token",
        description: "Authenticates email and password, returning a signed JWT access token valid for 7 days.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "alex@gearup.io" },
                  password: { type: "string", example: "Password123!" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Login Successful." },
                    data: {
                      type: "object",
                      properties: {
                        token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                        user: { $ref: "#/components/schemas/User" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorResponse" } } },
          },
          "403": {
            description: "Account is suspended by administrator",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorResponse" } } },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current authenticated user profile",
        description: "Retrieves profile and permissions of the currently authenticated bearer token.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "User profile fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "User fetched successfully." },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized - Token missing or expired",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiErrorResponse" } } },
          },
        },
      },
    },
    "/api/categories": {
      get: {
        tags: ["Categories"],
        summary: "List all categories",
        description: "Public endpoint returning all categories along with count of active gear items.",
        responses: {
          "200": {
            description: "Categories fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Categories fetched successfully" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Category" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Categories"],
        summary: "Create category (ADMIN only)",
        description: "Creates a new gear category. Requires ADMIN role.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "slug"],
                properties: {
                  name: { type: "string", minLength: 2, maxLength: 100, example: "Water Sports" },
                  slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", example: "water-sports" },
                  description: { type: "string", maxLength: 500, example: "Kayaks, paddleboards, and life jackets" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Category created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Category created successfully" },
                    data: { $ref: "#/components/schemas/Category" },
                  },
                },
              },
            },
          },
          "403": { description: "Forbidden - Requires ADMIN role" },
          "409": { description: "Category name or slug already exists" },
        },
      },
    },
    "/api/categories/{id}": {
      get: {
        tags: ["Categories"],
        summary: "Get category details by ID",
        description: "Public endpoint to retrieve category details and associated metadata.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, example: "cat_ck890abc456" }],
        responses: {
          "200": {
            description: "Category fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Category fetched successfully" },
                    data: { $ref: "#/components/schemas/Category" },
                  },
                },
              },
            },
          },
          "404": { description: "Category not found" },
        },
      },
      patch: {
        tags: ["Categories"],
        summary: "Update category (ADMIN only)",
        description: "Partially updates category name, slug, or description. Requires ADMIN role.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", minLength: 2, maxLength: 100 },
                  slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
                  description: { type: "string", maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Category updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Category updated successfully" },
                    data: { $ref: "#/components/schemas/Category" },
                  },
                },
              },
            },
          },
          "403": { description: "Forbidden - Admin role required" },
          "404": { description: "Category not found" },
        },
      },
      delete: {
        tags: ["Categories"],
        summary: "Delete category (ADMIN only)",
        description: "Deletes a category if no gear items are associated with it. Requires ADMIN role.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Category deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Category deleted successfully" },
                  },
                },
              },
            },
          },
          "403": { description: "Forbidden - Admin role required" },
          "404": { description: "Category not found" },
        },
      },
    },
    "/api/gears": {
      get: {
        tags: ["Gears"],
        summary: "List gear items with pagination & filters",
        description: "Public directory of sports and outdoor gear. Supports keyword search, category, brand, availability filters, and pagination.",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" }, description: "Filter by gear name, description, or brand" },
          { name: "categoryId", in: "query", schema: { type: "string" }, description: "Filter by Category ID" },
          { name: "brand", in: "query", schema: { type: "string" }, description: "Filter by brand name" },
          { name: "isAvailable", in: "query", schema: { type: "string", enum: ["true", "false"] }, description: "Filter by current stock availability" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number" },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 }, description: "Items per page (max 100)" },
        ],
        responses: {
          "200": {
            description: "Gears fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Gears fetched successfully" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Gear" } },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Gears"],
        summary: "Create new gear item (PROVIDER only)",
        description: "Registers a new rental item under the authenticated provider's inventory.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["categoryId", "name", "slug", "pricePerDay", "stock"],
                properties: {
                  categoryId: { type: "string", example: "cat_ck890abc456" },
                  name: { type: "string", minLength: 2, maxLength: 150, example: "Osprey Atmos AG 65L Backpack" },
                  slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", example: "osprey-atmos-ag-65l-backpack" },
                  description: { type: "string", maxLength: 2000, example: "Expedition backpack with Anti-Gravity suspension." },
                  brand: { type: "string", maxLength: 100, example: "Osprey" },
                  pricePerDay: { type: "number", minimum: 1, example: 18.0 },
                  stock: { type: "integer", minimum: 1, example: 5 },
                  imageUrl: { type: "string", format: "uri", example: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62" },
                  isAvailable: { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Gear created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Gear created successfully" },
                    data: { $ref: "#/components/schemas/Gear" },
                  },
                },
              },
            },
          },
          "400": { description: "Validation error" },
          "403": { description: "Forbidden - Requires PROVIDER role" },
          "409": { description: "Gear with this slug already exists" },
        },
      },
    },
    "/api/gears/{id}": {
      get: {
        tags: ["Gears"],
        summary: "Get gear details by ID",
        description: "Returns detailed gear information including category, provider profile, average rating, and review count.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, example: "gear_ck890def789" }],
        responses: {
          "200": {
            description: "Gear fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Gear fetched successfully" },
                    data: { $ref: "#/components/schemas/Gear" },
                  },
                },
              },
            },
          },
          "404": { description: "Gear not found" },
        },
      },
      patch: {
        tags: ["Gears"],
        summary: "Update gear item (PROVIDER only)",
        description: "Updates an existing gear item. Providers can only update gear that belongs to them.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  pricePerDay: { type: "number" },
                  stock: { type: "integer" },
                  imageUrl: { type: "string", format: "uri" },
                  isAvailable: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Gear updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Gear updated successfully" },
                    data: { $ref: "#/components/schemas/Gear" },
                  },
                },
              },
            },
          },
          "403": { description: "Forbidden - Provider does not own this gear" },
          "404": { description: "Gear not found" },
        },
      },
      delete: {
        tags: ["Gears"],
        summary: "Delete gear item (PROVIDER only)",
        description: "Removes a gear item from inventory. Cannot be deleted if active rentals exist.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Gear deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Gear deleted successfully" },
                  },
                },
              },
            },
          },
          "403": { description: "Forbidden - Not owned by authenticated provider" },
          "404": { description: "Gear not found" },
        },
      },
    },
    "/api/rentals": {
      get: {
        tags: ["Rentals"],
        summary: "List customer rental bookings",
        description: "Returns rental booking history for the authenticated customer.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Rental orders fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Rental orders fetched successfully" },
                    data: { type: "array", items: { $ref: "#/components/schemas/RentalOrder" } },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["Rentals"],
        summary: "Create rental order with inventory reservation",
        description:
          "Places a rental reservation across requested gear items. Enforces serializable database transactions to prevent double-booking. Transitions order to `PLACED` status.",
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
                    minItems: 1,
                    items: {
                      type: "object",
                      required: ["gearItemId", "quantity"],
                      properties: {
                        gearItemId: { type: "string", example: "gear_ck890def789" },
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
          "201": {
            description: "Rental order created successfully in PLACED state",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Rental order created successfully" },
                    data: { $ref: "#/components/schemas/RentalOrder" },
                  },
                },
              },
            },
          },
          "400": { description: "End date must be after start date or items belong to multiple providers" },
          "409": { description: "Insufficient stock or inventory already reserved for requested dates" },
        },
      },
    },
    "/api/rentals/{id}": {
      get: {
        tags: ["Rentals"],
        summary: "Get rental order details by ID",
        description: "Retrieves specific rental order for the logged-in customer including gear items, provider info, and payment records.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, example: "ord_ck890ord999" }],
        responses: {
          "200": {
            description: "Rental order fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Rental order fetched successfully" },
                    data: { $ref: "#/components/schemas/RentalOrder" },
                  },
                },
              },
            },
          },
          "404": { description: "Rental order not found or does not belong to user" },
        },
      },
    },
    "/api/rentals/{id}/cancel": {
      patch: {
        tags: ["Rentals"],
        summary: "Cancel rental order (CUSTOMER only)",
        description: "Cancels a rental order. Allowed only when order is in `PLACED` status prior to confirmation/payment.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Rental order cancelled successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Rental order cancelled successfully" },
                    data: { $ref: "#/components/schemas/RentalOrder" },
                  },
                },
              },
            },
          },
          "409": { description: "Order cannot be cancelled in current status" },
        },
      },
    },
    "/api/provider/rentals": {
      get: {
        tags: ["Provider Rentals"],
        summary: "List provider's incoming rental orders",
        description: "Returns all rental orders booked for gear owned by the authenticated provider.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Provider rental orders fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Provider rental orders fetched successfully" },
                    data: { type: "array", items: { $ref: "#/components/schemas/RentalOrder" } },
                  },
                },
              },
            },
          },
          "403": { description: "Forbidden - Requires PROVIDER role" },
        },
      },
    },
    "/api/provider/rentals/{id}/status": {
      patch: {
        tags: ["Provider Rentals"],
        summary: "Update rental lifecycle status (PROVIDER only)",
        description:
          "Advances rental lifecycle through the finite state machine: `CONFIRMED` -> `PICKED_UP` -> `RETURNED`. `RETURNED` triggers review eligibility for the customer.",
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
                  status: {
                    type: "string",
                    enum: ["CONFIRMED", "PICKED_UP", "RETURNED"],
                    example: "CONFIRMED",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Rental status updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Rental status updated successfully" },
                    data: { $ref: "#/components/schemas/RentalOrder" },
                  },
                },
              },
            },
          },
          "409": { description: "Invalid state transition (e.g. attempting RETURNED before PICKED_UP)" },
        },
      },
    },
    "/api/payments": {
      get: {
        tags: ["Payments"],
        summary: "Get customer payment history",
        description: "Returns all payments and associated refunds for the authenticated customer.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Payments fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Payments fetched successfully" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Payment" } },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["Payments"],
        summary: "Initialize Stripe payment intent (CUSTOMER only)",
        description:
          "Creates a Stripe PaymentIntent for a confirmed rental order. Requires `Idempotency-Key` header to prevent double charges on network retry.",
        security: [{ BearerAuth: [] }, { IdempotencyKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rentalOrderId", "method"],
                properties: {
                  rentalOrderId: { type: "string", example: "ord_ck890ord999" },
                  method: { type: "string", enum: ["STRIPE"], example: "STRIPE" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Payment initialized successfully with Stripe clientSecret",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Payment initialized successfully" },
                    data: { $ref: "#/components/schemas/Payment" },
                  },
                },
              },
            },
          },
          "400": { description: "Missing Idempotency-Key header or invalid payload" },
          "409": { description: "Rental order not in CONFIRMED state or already paid" },
        },
      },
    },
    "/api/payments/{id}": {
      get: {
        tags: ["Payments"],
        summary: "Get payment record by ID",
        description: "Retrieves payment details and refund logs for a specific payment ID.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, example: "pay_ck890pay111" }],
        responses: {
          "200": {
            description: "Payment fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Payment fetched successfully" },
                    data: { $ref: "#/components/schemas/Payment" },
                  },
                },
              },
            },
          },
          "404": { description: "Payment record not found" },
        },
      },
    },
    "/api/payments/refunds": {
      post: {
        tags: ["Refunds"],
        summary: "Process payment refund with PaymentRefund entity (CUSTOMER only)",
        description:
          "Issues a partial or full refund through Stripe. Creates an immutable `PaymentRefund` record with full lifecycle tracking (`PENDING` -> `COMPLETED`). Requires `Idempotency-Key` header.",
        security: [{ BearerAuth: [] }, { IdempotencyKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["paymentId", "amount"],
                properties: {
                  paymentId: { type: "string", example: "pay_ck890pay111" },
                  amount: { type: "number", minimum: 0.01, example: 25.0 },
                  reason: { type: "string", minLength: 3, maxLength: 500, example: "Gear returned 1 day early in mint condition" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Refund processed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Refund processed successfully" },
                    data: { $ref: "#/components/schemas/PaymentRefund" },
                  },
                },
              },
            },
          },
          "400": { description: "Order not RETURNED or amount exceeds refundable balance" },
          "409": { description: "Duplicate idempotency key conflict" },
        },
      },
    },
    "/api/payments/{id}/refund": {
      post: {
        tags: ["Refunds"],
        summary: "Process payment refund by Payment ID (CUSTOMER only)",
        description: "Alternative RESTful refund endpoint scoped directly to the target Payment resource ID.",
        security: [{ BearerAuth: [] }, { IdempotencyKey: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, example: "pay_ck890pay111" }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  amount: { type: "number", example: 35.0 },
                  reason: { type: "string", example: "Security deposit refund" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Refund processed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Refund processed successfully" },
                    data: { $ref: "#/components/schemas/PaymentRefund" },
                  },
                },
              },
            },
          },
          "400": { description: "Missing Idempotency-Key or amount exceeds remaining balance" },
          "404": { description: "Payment not found" },
        },
      },
    },
    "/api/payments/stripe/webhook": {
      post: {
        tags: ["Payments"],
        summary: "Stripe event webhook handler",
        description:
          "Receives asynchronous event notifications from Stripe (e.g. `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`). Verifies cryptographic HMAC signatures.",
        security: [{ StripeSignature: [] }],
        requestBody: {
          required: true,
          description: "Raw Stripe event JSON payload",
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        responses: {
          "200": {
            description: "Webhook event processed and acknowledged",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    received: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid webhook signature or malformed payload" },
        },
      },
    },
    "/api/reviews": {
      post: {
        tags: ["Reviews"],
        summary: "Submit review for returned gear (CUSTOMER only)",
        description:
          "Allows customers to review gear items from orders that have completed the full rental lifecycle (`RETURNED` status). Prevents duplicate reviews for the same order and gear.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rentalOrderId", "gearItemId", "rating"],
                properties: {
                  rentalOrderId: { type: "string", example: "ord_ck890ord999" },
                  gearItemId: { type: "string", example: "gear_ck890def789" },
                  rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
                  comment: { type: "string", maxLength: 1000, example: "Exceptional tent! Withstood heavy mountain rain with zero leaks." },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Review created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Review created successfully" },
                    data: { $ref: "#/components/schemas/Review" },
                  },
                },
              },
            },
          },
          "400": { description: "Rental order not returned or gear not included in order" },
          "409": { description: "Gear has already been reviewed for this rental order" },
        },
      },
    },
    "/api/reviews/gear/{gearItemId}": {
      get: {
        tags: ["Reviews"],
        summary: "Get reviews for a gear item",
        description: "Public endpoint retrieving all customer reviews, ratings, and pagination metadata for a specific gear item.",
        parameters: [
          { name: "gearItemId", in: "path", required: true, schema: { type: "string" }, example: "gear_ck890def789" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          "200": {
            description: "Reviews fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Reviews fetched successfully" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Review" } },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                },
              },
            },
          },
          "404": { description: "Gear item not found" },
        },
      },
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List all users (ADMIN only)",
        description: "Returns paginated list of all platform users. Requires ADMIN role.",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          "200": {
            description: "Users fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Users fetched successfully" },
                    data: { type: "array", items: { $ref: "#/components/schemas/User" } },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                },
              },
            },
          },
          "403": { description: "Forbidden - Requires ADMIN role" },
        },
      },
    },
    "/api/admin/users/{id}/status": {
      patch: {
        tags: ["Admin"],
        summary: "Update user account status (ADMIN only)",
        description: "Allows administrators to suspend or reactivate any user account (`ACTIVE` or `SUSPENDED`).",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, example: "usr_customer01" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["ACTIVE", "SUSPENDED"], example: "SUSPENDED" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "User status updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "User status updated successfully" },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          "403": { description: "Cannot change ADMIN account status" },
          "404": { description: "User not found" },
        },
      },
    },
    "/api/admin/gear": {
      get: {
        tags: ["Admin"],
        summary: "List all gear across providers (ADMIN only)",
        description: "Returns paginated list of all platform gear inventory across all providers. Requires ADMIN role.",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          "200": {
            description: "Gear items fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Gear items fetched successfully" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Gear" } },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                },
              },
            },
          },
          "403": { description: "Forbidden - Requires ADMIN role" },
        },
      },
    },
    "/api/admin/gear/{id}": {
      delete: {
        tags: ["Admin"],
        summary: "Force delete gear item (ADMIN only)",
        description: "Administrative deletion of any inappropriate, disputed, or discontinued gear item.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, example: "gear_ck890def789" }],
        responses: {
          "200": {
            description: "Gear deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Gear deleted successfully" },
                  },
                },
              },
            },
          },
          "403": { description: "Forbidden - Requires ADMIN role" },
          "404": { description: "Gear not found" },
        },
      },
    },
    "/api/admin/rentals": {
      get: {
        tags: ["Admin"],
        summary: "List all rentals platform-wide (ADMIN only)",
        description: "Comprehensive paginated list of all customer rental orders across the entire platform. Requires ADMIN role.",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          "200": {
            description: "Rental orders fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Rental orders fetched successfully" },
                    data: { type: "array", items: { $ref: "#/components/schemas/RentalOrder" } },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                },
              },
            },
          },
          "403": { description: "Forbidden - Requires ADMIN role" },
        },
      },
    },
    "/api/admin/refunds/reconcile": {
      post: {
        tags: ["Admin"],
        summary: "Trigger distributed refund reconciliation (ADMIN only)",
        description:
          "Runs an automated reconciliation scan across pending or processing refunds. Queries the Stripe API to verify refund statuses and synchronizes the local database.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Refund reconciliation executed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Refund reconciliation executed successfully" },
                    data: {
                      type: "object",
                      properties: {
                        checked: { type: "integer", example: 4 },
                        updated: { type: "integer", example: 1 },
                        failed: { type: "integer", example: 0 },
                        timestamp: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
          "403": { description: "Forbidden - Requires ADMIN role" },
        },
      },
    },
  },
};
