import prisma from "../../config/database.js";
import { AppError } from "../../middlewares/AppError.js";
import { getPaymentGateway } from "./payment.gateway.factory.js";
import type { CreatePaymentInput } from "./payment.validation.js";

export const createPayment = async (
  userId: string,
  data: CreatePaymentInput,
  idempotencyKey: string,
) => {
  const existingPayment = await prisma.payment.findUnique({
    where: {
      idempotencyKey,
    },
  });

  if (existingPayment) {
    if (existingPayment.userId !== userId) {
      throw new AppError("Invalid idempotency key", 409);
    }

    if (existingPayment.rentalOrderId !== data.rentalOrderId) {
      throw new AppError(
        "Idempotency key was already used for another rental order",
        409,
      );
    }

    if (existingPayment.method !== data.method) {
      throw new AppError(
        "Idempotency key was already used with another payment method",
        409,
      );
    }

    return {
      payment: existingPayment,
      gateway: existingPayment.method,
      clientSecret: existingPayment.clientSecret ?? undefined,
      checkoutUrl: existingPayment.checkoutUrl ?? undefined,
      reused: true,
    };
  }

  const rentalOrder = await prisma.rentalOrder.findFirst({
    where: {
      id: data.rentalOrderId,
      customerId: userId,
    },

    include: {
      customer: {
        select: {
          name: true,
          email: true,
        },
      },
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

  const existingOrderPayment = rentalOrder.payments[0];

  if (existingOrderPayment) {
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
      currency: "BDT",
      method: data.method,
      provider: data.method,
      status: "PENDING",
      idempotencyKey,
    },
  });

  const gateway = getPaymentGateway(data.method);

  const transactionId = payment.id;

  try {
    const result = await gateway.createPayment({
      amount: Number(rentalOrder.totalAmount),
      currency: payment.currency,
      transactionId,
      paymentId: payment.id,
      rentalOrderId: rentalOrder.id,
      customerName: rentalOrder.customer.name,
      customerEmail: rentalOrder.customer.email,
    });

    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        transactionId: result.providerTransactionId,

        clientSecret: result.clientSecret ?? null,

        checkoutUrl: result.checkoutUrl ?? null,
      },
    });

    return {
      payment: updatedPayment,
      gateway: data.method,
      clientSecret: result.clientSecret ?? undefined,
      checkoutUrl: result.checkoutUrl ?? undefined,
      reused: false,
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

export const getMyPayments = async (userId: string) => {
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
          startTime: true,
          endTime: true,
          totalAmount: true,
          status: true,
        },
      },
    },
  });
};

export const getPaymentById = async (paymentId: string, userId: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      userId,
    },

    include: {
      rentalOrder: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
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

export default createPayment;
