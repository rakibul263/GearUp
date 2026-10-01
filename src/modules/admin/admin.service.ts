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

export const getAllGear = async () => {
  return prisma.gear.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
};

export const deleteGearAsAdmin = async (gearItemId: string) => {
  const gearItem = await prisma.gear.findUnique({
    where: {
      id: gearItemId,
    },
    include: {
      rentalItems: {
        where: {
          rentalOrder: {
            status: {
              in: ["PLACED", "CONFIRMED", "PAID", "PICKED_UP"],
            },
          },
        },
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  if (!gearItem) {
    throw new AppError("Gear item not found", 404);
  }

  if (gearItem.rentalItems.length > 0) {
    throw new AppError(
      "Gear cannot be deleted while it has active rentals",
      409,
    );
  }

  await prisma.gear.delete({
    where: {
      id: gearItemId,
    },
  });
};

export const getAllRentals = async () => {
  return prisma.rentalOrder.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      rentalItems: {
        include: {
          gearItem: {
            select: {
              id: true,
              name: true,
              slug: true,
              pricePerDay: true,
              provider: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          currency: true,
          method: true,
          provider: true,
          status: true,
          transactionId: true,
          paidAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
};

export const adminService = {
  getAllUsers,
  updateUserStatus,
  getAllGear,
  deleteGearAsAdmin,
  getAllRentals,
};
