import type { PaymentProvider } from "../../../generated/prisma/client.js";
import { AppError } from "../../middlewares/AppError.js";
import { StripeGateway } from "./gateways/stripe.gateway.js";
import type { PaymentRefundGateway } from "./payment.refund.gateway.js";

export const getPaymentRefundGateway = (
  provider: PaymentProvider,
): PaymentRefundGateway => {
  switch (provider) {
    case "STRIPE":
      return new StripeGateway();
    default:
      throw new AppError(
        `Unsupported payment provider for refund: ${provider}`,
        400,
      );
  }
};
