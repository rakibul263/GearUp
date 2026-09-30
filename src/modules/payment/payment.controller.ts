import { Request, Response } from "express";

import { paymentService } from "./payment.service.js";
import { AppError } from "../../middlewares/AppError.js";

const createPayment = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const payment = await paymentService.createPayment(req.user.userId, req.body);

  res.status(201).json({
    success: true,
    message: "Payment initialized successfully",
    data: payment,
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

  const { id } = req.params;

  const payment = await paymentService.getPaymentById(
    id as string,
    req.user.userId,
  );

  res.status(200).json({
    success: true,
    message: "Payment fetched successfully",
    data: payment,
  });
};

export const paymentController = {
  createPayment,
  getMyPayments,
  getPaymentById,
};
