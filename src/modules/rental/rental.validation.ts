import { z } from "zod";

const rentalDateSchema = z.coerce.date();

export const createRentalSchema = z.object({
  startDate: rentalDateSchema,
  endDate: rentalDateSchema,

  items: z
    .array(
      z.object({
        gearItemId: z.string().min(1, "Gear item is required"),
        quantity: z.coerce
          .number()
          .int("Quantity must be an integer")
          .min(1, "Quantity must be at least 1"),
      }),
    )
    .min(1, "At least one gear item is required"),
});

export const updateRentalStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "PICKED_UP", "RETURNED"]),
});

export type CreateRentalInput = z.infer<typeof createRentalSchema>;
export type UpdateRentalStatusInput = z.infer<typeof updateRentalStatusSchema>;
