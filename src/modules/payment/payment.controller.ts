import type { Request, Response } from "express";
import { AppError } from "../../middlewares/AppError.js";
import { refundPayment } from "./payment.refund.service.js";
import { paymentService } from "./payment.service.js";
import { handleStripeWebhook } from "./payment.webhook.js";

export const handleCreatePayment = async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const idempotencyKey = req.headers["idempotency-key"];

  if (
    typeof idempotencyKey !== "string" ||
    idempotencyKey.trim().length === 0
  ) {
    throw new AppError("Idempotency-Key header is required", 400);
  }

  const result = await paymentService.createPayment(
    userId,
    req.body,
    idempotencyKey,
  );

  res.status(201).json({
    success: true,
    message: "Payment initialized successfully",
    data: result,
  });
};

export const getMyPayments = async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const payments = await paymentService.getMyPayments(userId);

  res.status(200).json({
    success: true,
    message: "Payments fetched successfully",
    data: payments,
  });
};

export const getPaymentById = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  if (typeof id !== "string" || id.length === 0) {
    throw new AppError("Invalid payment id", 400);
  }

  const payment = await paymentService.getPaymentById(id, userId);

  res.status(200).json({
    success: true,
    message: "Payment fetched successfully",
    data: payment,
  });
};

export const handleRefundPayment = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  if (typeof id !== "string" || id.length === 0) {
    throw new AppError("Invalid payment id", 400);
  }

  const result = await refundPayment(userId, id, req.body);

  res.status(200).json({
    success: true,
    message: "Payment refunded successfully",
    data: result,
  });
};

export const stripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];

  if (typeof signature !== "string") {
    throw new AppError("Stripe signature is required", 400);
  }

  await handleStripeWebhook(req.body, signature);

  res.status(200).json({ received: true });
};

export const paymentController = {
  createPayment: handleCreatePayment,
  getMyPayments,
  getPaymentById,
  refundPayment: handleRefundPayment,
  stripeWebhook,
};

export default handleCreatePayment;
