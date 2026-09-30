import { z } from "zod";

export const createPaymentSchema = z.object({
  rentalOrderId: z.string().min(1, "Rental order is required."),

  method: z.enum(["STRIPE", "SSLCOMMERZ"]),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
