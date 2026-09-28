import { z } from "zod";

export const createGearSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),

  name: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(150, "Gear name must not exceed 150 character."),

  slug: z
    .string()
    .min(2, "Gear name must be at least 2 characters.")
    .max(200, "Slug must not exceed 180 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),

  description: z
    .string()
    .max(2000, "Description must not exceed 2000 character."),

  brand: z.string().max(100, "Brand must not exceed 100 characters").optional(),

  pricePerDay: z.coerce
    .number()
    .positive("Price per day must be greater than 0"),

  stock: z.coerce
    .number()
    .int("Stock must be an integer")
    .min(1, "Stock must be at least 1"),

  imageUrl: z.string().url("Invalid image URL").optional(),

  specifications: z.record(z.string(), z.unknown()).optional(),

  isAvailable: z.boolean().default(true),
});

export const gearListQuerySchema = z.object({
  search: z.string().trim().optional(),

  categoryId: z.string().optional(),

  brand: z.string().trim().optional(),

  isAvailable: z.enum(["true", "false"]).optional(),

  page: z.string().optional(),

  limit: z.string().optional(),
});

export const updateGearSchema = createGearSchema.partial();

export type CreateGearInput = z.infer<typeof createGearSchema>;

export type UpdateGearInput = z.infer<typeof updateGearSchema>;

export type GearListQuery = z.infer<typeof gearListQuerySchema>;
