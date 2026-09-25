import prisma from "../../config/database";
import { AppError } from "../../middlewares/AppError";
import { hashPassword, comparePassword } from "../../utils/password";
import { generateAccessToken } from "../../utils/jwt";
import type { LoginInput, RegisterInput } from "./auth.validation";

const register = async (data: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new AppError("User already exists with this email", 409);
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      phone: data.phone,
      role: data.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return user;
};

const login = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (user.status === "INACTIVE") {
    throw new AppError("Your account is inactive. Please contact support.", 403);
  }

  const isPasswordValid = await comparePassword(
    data.password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
  });

  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    },
  };
};

const getMe = async(userId: string) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
        }
    })

    if (!user) {
        throw new AppError("User not found", 404);
    }

    if(user.status === "SUSPENDED") {
        throw new AppError("Your account has been suspended", 403)
    }

    return user;
}

export const authService = {
  register,
  login,
  getMe
};
