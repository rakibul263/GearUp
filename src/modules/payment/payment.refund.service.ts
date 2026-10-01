import prisma from "../../config/database.js";
import { AppError } from "../../middlewares/AppError.js";
import type {
  CreateRefundInput,
  RefundPaymentInput,
} from "./payment.validation.js";
import { getPaymentRefundGateway } from "./payment.refund.gateway.factory.js";

export const createRefund = async (
  userId: string,
  idempotencyKey: string,
  data: CreateRefundInput,
) => {
  const existingRefund = await prisma.paymentRefund.findUnique({
    where: {
      idempotencyKey,
    },
    include: {
      payment: true,
    },
  });

  if (existingRefund) {
    if (existingRefund.userId !== userId) {
      throw new AppError("Invalid refund idempotency key", 409);
    }

    return existingRefund;
  }

  const payment = await prisma.payment.findFirst({
    where: {
      id: data.paymentId,
      userId,
    },
    include: {
      rentalOrder: true,
      refunds: {
        where: {
          status: {
            in: ["PENDING", "PROCESSING", "COMPLETED"],
          },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  if (payment.status !== "COMPLETED") {
    throw new AppError("Only completed payments can be refunded", 400);
  }

  if (!payment.transactionId) {
    throw new AppError("Payment transaction ID is missing", 400);
  }

  if (payment.rentalOrder.status !== "RETURNED") {
    throw new AppError("Rental must be returned before refund", 400);
  }

  const alreadyRefundedAmount = payment.refunds.reduce(
    (total, refund) => total + Number(refund.amount),
    0,
  );

  const remainingRefundableAmount =
    Number(payment.amount) - alreadyRefundedAmount;

  if (data.amount > remainingRefundableAmount) {
    throw new AppError(
      `Maximum refundable amount is ${remainingRefundableAmount}`,
      400,
    );
  }

  const refund = await prisma.paymentRefund.create({
    data: {
      paymentId: payment.id,
      userId,
      amount: data.amount,
      currency: payment.currency,
      reason: data.reason,
      idempotencyKey,
      status: "PROCESSING",
    },
  });

  try {
    const gateway = getPaymentRefundGateway(payment.provider);

    const result = await gateway.refundPayment({
      providerTransactionId: payment.transactionId,
      amount: data.amount,
      currency: payment.currency,
      reason: data.reason,
    });

    const updatedRefund = await prisma.paymentRefund.update({
      where: {
        id: refund.id,
      },
      data: {
        status: "COMPLETED",
        providerRefundId: result.providerRefundId,
        refundedAt: new Date(),
      },
    });

    return updatedRefund;
  } catch (error) {
    await prisma.paymentRefund.update({
      where: {
        id: refund.id,
      },
      data: {
        status: "FAILED",
      },
    });

    throw error;
  }
};

export const refundPayment = async (
  userId: string,
  paymentId: string,
  data: RefundPaymentInput,
  idempotencyKey?: string,
) => {
  let amount = data.amount;

  if (amount === undefined || amount === null) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId },
      include: {
        refunds: {
          where: {
            status: { in: ["PENDING", "PROCESSING", "COMPLETED"] },
          },
        },
      },
    });

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    const alreadyRefunded = payment.refunds.reduce(
      (sum, r) => sum + Number(r.amount),
      0,
    );
    amount = Number(payment.amount) - alreadyRefunded;
  }

  return createRefund(
    userId,
    idempotencyKey || `refund-${paymentId}-${Date.now()}`,
    {
      paymentId,
      amount,
      reason: data.reason,
    },
  );
};
