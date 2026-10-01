import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/notFound.middleware.js";
import apiRoutes from "./routes/index.js";
import paymentWebhookRoutes from "./modules/payment/payment.webhook.route.js";

const app: Application = express();

app.use(cors());
app.use(cookieParser());
app.use("/api/payments/webhook", paymentWebhookRoutes);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("GearUp API is running");
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "GearUp API is running",
  });
});

app.use("/api", apiRoutes)

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
