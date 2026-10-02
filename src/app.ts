import cookieParser from "cookie-parser";
import express, { Application } from "express";

import docsRoute from "./docs/docs.route.js";
import { correlationIdMiddleware } from "./middlewares/correlation.middleware.js";
import { productionCors } from "./middlewares/cors.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { requestLogger } from "./middlewares/logger.middleware.js";
import { notFoundMiddleware } from "./middlewares/notFound.middleware.js";
import { globalLimiter } from "./middlewares/rateLimit.middleware.js";
import { securityHeaders } from "./middlewares/security.middleware.js";
import stripeWebhookRoute from "./modules/payment/stripe-webhook.route.js";
import routes from "./routes/index.js";

const app: Application = express();

// Security Hardening
app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(securityHeaders);
app.use(productionCors);
app.use(correlationIdMiddleware);
app.use(cookieParser());
app.use(requestLogger);

// Public root and health check
app.get("/", (_req, res) => {
  res.send("GearUp API is running");
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "GearUp API is running",
  });
});

// Interactive Swagger/OpenAPI Documentation
app.use("/docs", docsRoute);
app.use("/api/docs", docsRoute);

// Stripe webhook must receive the raw body before express.json()
app.use("/api/payments/stripe/webhook", stripeWebhookRoute);
app.use("/api/payments/webhook", stripeWebhookRoute);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  }),
);

// Apply global rate limiting to all /api routes
app.use("/api", globalLimiter);
app.use("/api", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
