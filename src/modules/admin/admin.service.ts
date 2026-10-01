import prisma from "../../config/database.js";
import { AppError } from "../../middlewares/AppError.js";
import type { UpdateUserStatusInput } from "./admin.validation.js";

export const getAllUsers = async () => {
  return prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
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
    },
  });
};

export const updateUserStatus = async (
  adminId: string,
  userId: string,
  data: UpdateUserStatusInput,
) => {
  if (adminId === userId) {
    throw new AppError("You cannot change your own status", 400);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role === "ADMIN") {
    throw new AppError("Admin status cannot be changed", 403);
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status: data.status,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

export const adminService = {
  getAllUsers,
  updateUserStatus,
};
