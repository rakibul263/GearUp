import cors, { type CorsOptions } from "cors";
import { env } from "../config/env.js";

const parseAllowedOrigins = (): string[] => {
  const raw = process.env.CORS_ORIGIN;
  if (!raw || raw.trim() === "*") {
    return [];
  }
  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. curl, Postman, mobile apps, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // In development or when no strict whitelist is set, allow all origins
    if (env.NODE_ENV !== "production" || allowedOrigins.length === 0) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`Origin '${origin}' not allowed by CORS policy`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Idempotency-Key",
    "X-Request-Id",
    "stripe-signature",
  ],
  exposedHeaders: [
    "X-Request-Id",
    "RateLimit-Limit",
    "RateLimit-Remaining",
    "RateLimit-Reset",
  ],
  maxAge: 86400, // 24 hours preflight cache
};

export const productionCors = cors(corsOptions);
