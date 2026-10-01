import { z } from "zod";

export const createPaymentSchema = z.object({
  rentalOrderId: z.string().min(1, "Rental order is required"),
  method: z.enum(["STRIPE"]),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const refundPaymentSchema = z.object({
  reason: z
    .string()
    .min(3, "Refund reason is too short")
    .max(500, "Refund reason is too long")
    .optional(),
});

export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
