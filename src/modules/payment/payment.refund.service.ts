import { AppError } from "../../middlewares/AppError.js";
import prisma from "../../config/database.js";
import type { RefundPaymentInput } from "./payment.validation.js";
import { getPaymentRefundGateway } from "./payment.refund.gateway.factory.js";

export const refundPayment = async (
  userId: string,
  paymentId: string,
  data: RefundPaymentInput,
) => {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      userId,
    },
    include: {
      rentalOrder: true,
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

  if (payment.rentalOrder.status === "CANCELED") {
    // allowed
  } else if (payment.rentalOrder.status !== "RETURNED") {
    throw new AppError(
      "Rental must be returned or cancelled before refund",
      400,
    );
  }

  const gateway = getPaymentRefundGateway(payment.provider);

  const refundResult = await gateway.refundPayment({
    providerTransactionId: payment.transactionId,
    amount: Number(payment.amount),
    currency: payment.currency,
    reason: data.reason,
  });

  const updatedPayment = await prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      status: "REFUNDED",
      refundId: refundResult.providerRefundId,
      refundedAt: new Date(),
    },
  });

  return {
    payment: updatedPayment,
    providerRefundId: refundResult.providerRefundId,
  };
};
