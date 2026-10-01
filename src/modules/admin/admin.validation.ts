import { z } from "zod";

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
