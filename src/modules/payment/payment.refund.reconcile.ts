import prisma from "../../config/database.js";
import { stripe } from "../../config/stripe.js";
import { AppError } from "../../errors/AppError.js";

export interface ReconciliationReport {
  totalProcessed: number;
  completed: number;
  failed: number;
  stillProcessing: number;
  errors: Array<{ refundId: string; error: string }>;
}

export const reconcilePendingRefunds = async (
  olderThanMinutes = 5,
): Promise<ReconciliationReport> => {
  if (!stripe) {
    throw new AppError("Stripe is not configured for refund reconciliation", 503);
  }

  const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);

  // Find refunds stuck in PROCESSING state
  const stuckRefunds = await prisma.paymentRefund.findMany({
    where: {
      status: "PROCESSING",
      createdAt: {
        lte: cutoffTime,
      },
    },
    include: {
      payment: true,
    },
  });

  const report: ReconciliationReport = {
    totalProcessed: stuckRefunds.length,
    completed: 0,
    failed: 0,
    stillProcessing: 0,
    errors: [],
  };

  for (const refund of stuckRefunds) {
    try {
      if (refund.providerRefundId) {
        // Query Stripe directly by provider refund ID
        const stripeRefund = await stripe.refunds.retrieve(
          refund.providerRefundId,
        );

        if (stripeRefund.status === "succeeded") {
          await prisma.paymentRefund.update({
            where: { id: refund.id },
            data: {
              status: "COMPLETED",
              refundedAt: new Date(stripeRefund.created * 1000),
            },
          });
          report.completed++;
        } else if (
          stripeRefund.status === "failed" ||
          stripeRefund.status === "canceled"
        ) {
          await prisma.paymentRefund.update({
            where: { id: refund.id },
            data: {
              status: "FAILED",
            },
          });
          report.failed++;
        } else {
          report.stillProcessing++;
        }
      } else if (refund.payment.transactionId) {
        // Find refunds under the payment intent
        const stripeRefunds = await stripe.refunds.list({
          payment_intent: refund.payment.transactionId,
          limit: 10,
        });

        const matchedStripeRefund = stripeRefunds.data.find(
          (sr) =>
            sr.amount === Math.round(Number(refund.amount) * 100) &&
            sr.status === "succeeded",
        );

        if (matchedStripeRefund) {
          await prisma.paymentRefund.update({
            where: { id: refund.id },
            data: {
              status: "COMPLETED",
              providerRefundId: matchedStripeRefund.id,
              refundedAt: new Date(matchedStripeRefund.created * 1000),
            },
          });
          report.completed++;
        } else {
          // If 15+ minutes old and no Stripe record exists, mark FAILED
          const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
          if (refund.createdAt <= fifteenMinutesAgo) {
            await prisma.paymentRefund.update({
              where: { id: refund.id },
              data: { status: "FAILED" },
            });
            report.failed++;
          } else {
            report.stillProcessing++;
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      report.errors.push({ refundId: refund.id, error: message });
    }
  }

  return report;
};
