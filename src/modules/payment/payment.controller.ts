import { Request, Response } from "express";

import { paymentService } from "./payment.service.js";
import { handleStripeWebhook } from "./payment.webhook.js";
import { AppError } from "../../middlewares/AppError.js";

const createPayment = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const result = await paymentService.createPayment(req.user.userId, req.body);

  res.status(201).json({
    success: true,
    message: "Stripe payment initialized successfully",
    data: result,
  });
};

const getMyPayments = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const payments = await paymentService.getMyPayments(req.user.userId);

  res.status(200).json({
    success: true,
    message: "Payment history fetched successfully",
    data: payments,
  });
};

const getPaymentById = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const payment = await paymentService.getPaymentById(
    req.params.id as string,
    req.user.userId,
  );

  res.status(200).json({
    success: true,
    message: "Payment fetched successfully",
    data: payment,
  });
};

const stripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    res.status(400).json({
      success: false,
      message: "Missing Stripe signature",
    });

    return;
  }

  if (Array.isArray(signature)) {
    res.status(400).json({
      success: false,
      message: "Invalid Stripe signature",
    });

    return;
  }

  await handleStripeWebhook(req.body as Buffer, signature);

  res.status(200).json({
    received: true,
  });
};

export const paymentController = {
  createPayment,
  getMyPayments,
  getPaymentById,
  stripeWebhook,
};
