import type { PaymentCurrency } from "../../../generated/prisma/client.js";

export interface PaymentGatewayResult {
  providerTransactionId: string;
  checkoutUrl?: string;
  clientSecret?: string;
}

export interface PaymentGateway {
  createPayment(input: {
    amount: number;
    currency: PaymentCurrency;
    transactionId: string;
    paymentId: string;
    rentalOrderId: string;
    customerName: string;
    customerEmail: string;
  }): Promise<PaymentGatewayResult>;
}
