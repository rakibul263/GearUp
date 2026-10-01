import type {
  PaymentCurrency,
  PaymentMethod,
} from "../../generated/prisma/client.js";

export const PAYMENT_CURRENCY = {
  BDT: "BDT",
  USD: "USD",
} as const satisfies Record<PaymentCurrency, PaymentCurrency>;

export const PAYMENT_METHOD = {
  STRIPE: "STRIPE",
} as const satisfies Record<PaymentMethod, PaymentMethod>;
