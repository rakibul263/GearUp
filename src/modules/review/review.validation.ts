import { z } from "zod";

export const createReviewSchema = z.object({
  rentalOrderId: z.string().min(1, "Rental order is required"),
  gearItemId: z.string().min(1, "Gear item is required"),
  rating: z
    .coerce
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must not exceed 5"),
  comment: z
    .string()
    .max(1000, "Comment must not exceed 1000 characters")
    .optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
