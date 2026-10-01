import { z } from "zod";

export const createPaymentSchema = z.object({
  rentalOrderId: z.string().min(1, "Rental order is required"),
  method: z.enum(["STRIPE"]),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const createRefundSchema = z.object({
  paymentId: z.string().min(1, "Payment is required"),
  amount: z.coerce
    .number()
    .positive("Refund amount must be greater than zero"),
  reason: z
    .string()
    .min(3, "Refund reason is too short")
    .max(500, "Refund reason is too long")
    .optional(),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;

export const refundPaymentSchema = z.object({
  paymentId: z.string().min(1, "Payment is required").optional(),
  amount: z.coerce
    .number()
    .positive("Refund amount must be greater than zero")
    .optional(),
  reason: z
    .string()
    .min(3, "Refund reason is too short")
    .max(500, "Refund reason is too long")
    .optional(),
});

export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
