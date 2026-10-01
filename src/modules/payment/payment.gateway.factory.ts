import type { PaymentProvider } from "../../../generated/prisma/client.js";
import { AppError } from "../../middlewares/AppError.js";
import { StripeGateway } from "./gateways/stripe.gateway.js";
import type { PaymentGateway } from "./payment.gateway.js";

export const getPaymentGateway = (
  method: PaymentProvider | string,
): PaymentGateway => {
  switch (method) {
    case "STRIPE":
      return new StripeGateway();
    default:
      throw new AppError(`Unsupported payment method: ${method}`, 400);
  }
};
