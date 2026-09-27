import { z } from "zod";
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 character.")
    .max(100, "Category name must not exceed 100 characters"),

  slug: z
    .string()
    .min(2, "slug must be at least 2 character")
    .max(120, "Slug must nost exceed 120 character.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),

  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
