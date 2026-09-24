import prisma from "../../config/database";
import { AppError } from "../../middlewares/AppError";
import { hashPassword } from "../../utils/password";
import { RegisterInput } from "./auth.validation";

const register = async(data: RegisterInput) => {
    const existingUser = await prisma.user.findUnique({
        where: {
            email: data.email
        }
    })

    if(existingUser) {
        throw new AppError("User already exists with this email", 409)
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            passwordHash,
            phone: data.phone,
            role: data.role
        },

        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true
        }
    })
    return user
}

export const authService = {
    register
}