export interface PaymentRefundResult {
  providerRefundId: string;
}

export interface PaymentRefundGateway {
  refundPayment(input: {
    providerTransactionId: string;
    amount: number;
    currency: string;
    reason?: string;
  }): Promise<PaymentRefundResult>;
}
