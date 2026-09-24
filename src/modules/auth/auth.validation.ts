import {z} from "zod"

export const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 character.")
    .max(100, "Name must not exceed 100 characters"),

    email: z.string().email("Invalid Email Address").toLowerCase(),

    password: z.string().min(6, "Password must be at least 6 character").max(100, "Password must not exceed 100 character."),

    phone: z.string().min(10, "Invalid Phone Number.").max(20, "Invalid Phone Number."),
    
    role: z.enum(["CUSTOMER", "PROVIDER"]).default("CUSTOMER")
})

export type RegisterInput = z.infer<typeof registerSchema>;