import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";

import { errorMiddleware } from "./middlewares/error.middleware.js";
import { requestLogger } from "./middlewares/logger.middleware.js";
import { notFoundMiddleware } from "./middlewares/notFound.middleware.js";
import stripeWebhookRoute from "./modules/payment/stripe-webhook.route.js";
import routes from "./routes/index.js";

const app: Application = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(requestLogger);

app.get("/", (_req, res) => {
  res.send("GearUp API is running");
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "GearUp API is running",
  });
});

// Stripe webhook must receive the raw body before express.json()
app.use("/api/payments/stripe/webhook", stripeWebhookRoute);
app.use("/api/payments/webhook", stripeWebhookRoute);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use("/api", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
