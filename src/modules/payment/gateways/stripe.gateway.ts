import { stripe } from "../../../config/stripe.js";
import { AppError } from "../../../middlewares/AppError.js";
import type {
  PaymentGateway,
  PaymentGatewayResult,
} from "../payment.gateway.js";
import type {
  PaymentRefundGateway,
  PaymentRefundResult,
} from "../payment.refund.gateway.js";

export class StripeGateway
  implements PaymentGateway, PaymentRefundGateway
{
  async createPayment(input: {
    amount: number;
    currency: "BDT" | "USD";
    transactionId: string;
    paymentId: string;
    rentalOrderId: string;
    customerName: string;
    customerEmail: string;
  }): Promise<PaymentGatewayResult> {
    if (!stripe) {
      throw new AppError("Stripe is not configured", 503);
    }

    const amountInMinorUnit = Math.round(input.amount * 100);

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountInMinorUnit,
        currency: input.currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          paymentId: input.paymentId,
          rentalOrderId: input.rentalOrderId,
        },
        description: `GearUp rental ${input.rentalOrderId}`,
      },
      {
        idempotencyKey: input.transactionId,
      },
    );

    if (!paymentIntent.client_secret) {
      throw new AppError("Stripe did not return a client secret", 500);
    }

    return {
      providerTransactionId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    };
  }

  async refundPayment(input: {
    providerTransactionId: string;
    amount: number;
    currency: string;
    reason?: string;
  }): Promise<PaymentRefundResult> {
    if (!stripe) {
      throw new AppError("Stripe is not configured", 503);
    }

    const amountInMinorUnit = Math.round(input.amount * 100);

    const refund = await stripe.refunds.create({
      payment_intent: input.providerTransactionId,
      amount: amountInMinorUnit,
      reason: "requested_by_customer",
    });

    return {
      providerRefundId: refund.id,
    };
  }
}
