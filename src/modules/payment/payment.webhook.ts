import prisma from "../../config/database.js";
import { env } from "../../config/env.js";
import { stripe } from "../../config/stripe.js";

export const handleStripeWebhook = async (
  payload: Buffer,
  signature: string,
) => {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe webhook secret is not configured");
  }

  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    env.STRIPE_WEBHOOK_SECRET,
  );

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;

      const paymentId = paymentIntent.metadata.paymentId;

      const rentalOrderId = paymentIntent.metadata.rentalOrderId;

      if (!paymentId || !rentalOrderId) {
        throw new Error("Missing payment metadata");
      }

      await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({
          where: {
            id: paymentId,
          },
        });

        if (!payment) {
          throw new Error("Payment record not found");
        }

        if (payment.status === "COMPLETED") {
          return;
        }

        await tx.payment.update({
          where: {
            id: payment.id,
          },

          data: {
            status: "COMPLETED",
            paidAt: new Date(),
            transactionId: paymentIntent.id,
          },
        });

        await tx.rentalOrder.update({
          where: {
            id: rentalOrderId,
          },

          data: {
            status: "PAID",
          },
        });
      });

      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;

      const paymentId = paymentIntent.metadata.paymentId;

      if (!paymentId) {
        break;
      }

      await prisma.payment.updateMany({
        where: {
          id: paymentId,
          status: "PENDING",
        },

        data: {
          status: "FAILED",
        },
      });

      break;
    }

    default:
      break;
  }
};
