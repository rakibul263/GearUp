import prisma from "../../config/database.js";
import { env } from "../../config/env.js";
import { stripe } from "../../config/stripe.js";
import { AppError } from "../../middlewares/AppError.js";
import type { CreatePaymentInput } from "./payment.validation.js";

const createPayment = async (userId: string, data: CreatePaymentInput) => {
  if (data.method !== "STRIPE") {
    throw new AppError("Only Stripe payment is currently available", 400);
  }

  if (!stripe) {
    throw new AppError("Stripe payment is not configured", 503);
  }

  const rentalOrder = await prisma.rentalOrder.findFirst({
    where: {
      id: data.rentalOrderId,
      customerId: userId,
    },

    include: {
      payments: {
        where: {
          status: {
            in: ["PENDING", "COMPLETED"],
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 1,
      },
    },
  });

  if (!rentalOrder) {
    throw new AppError("Rental order not found", 404);
  }

  if (rentalOrder.status === "CANCELED") {
    throw new AppError("Cannot create payment for a cancelled rental", 409);
  }

  if (rentalOrder.status === "PLACED") {
    throw new AppError("Rental order must be confirmed before payment", 409);
  }

  if (
    rentalOrder.status === "PAID" ||
    rentalOrder.status === "PICKED_UP" ||
    rentalOrder.status === "RETURNED"
  ) {
    throw new AppError("This rental order has already been paid", 409);
  }

  const existingPayment = rentalOrder.payments[0];

  if (existingPayment) {
    throw new AppError(
      "A payment is already pending or completed for this rental",
      409,
    );
  }

  const payment = await prisma.payment.create({
    data: {
      userId,
      rentalOrderId: rentalOrder.id,
      amount: rentalOrder.totalAmount,
      method: "STRIPE",
      provider: "STRIPE",
      status: "PENDING",
    },
  });

  try {
    const amountInCents = Math.round(Number(rentalOrder.totalAmount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",

      automatic_payment_methods: {
        enabled: true,
      },

      metadata: {
        paymentId: payment.id,
        rentalOrderId: rentalOrder.id,
        userId,
      },

      description: `GearUp rental ${rentalOrder.id}`,

      receipt_email: undefined,
    });

    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        transactionId: paymentIntent.id,
      },
    });

    return {
      payment: updatedPayment,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        status: "FAILED",
      },
    });

    throw error;
  }
};

const getMyPayments = async (userId: string) => {
  return prisma.payment.findMany({
    where: {
      userId,
    },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      rentalOrder: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          totalAmount: true,
          status: true,
        },
      },
    },
  });
};

const getPaymentById = async (paymentId: string, userId: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      userId,
    },

    include: {
      rentalOrder: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          subtotal: true,
          totalAmount: true,
          status: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  return payment;
};

export const paymentService = {
  createPayment,
  getMyPayments,
  getPaymentById,
};
