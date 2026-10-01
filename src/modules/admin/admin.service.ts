import prisma from "../../config/database.js";
import { AppError } from "../../middlewares/AppError.js";
import type { PaginationOptions } from "../../utils/pagination.js";
import type { UpdateUserStatusInput } from "./admin.validation.js";

export const getAllUsers = async (pagination: PaginationOptions) => {
  const { page, limit, skip } = pagination;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      skip,
      take: limit,
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
    }),

    prisma.user.count(),
  ]);

  return {
    data: users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
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

export const getAllGear = async (pagination: PaginationOptions) => {
  const { page, limit, skip } = pagination;

  const [gear, total] = await prisma.$transaction([
    prisma.gear.findMany({
      skip,
      take: limit,
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
    }),

    prisma.gear.count(),
  ]);

  return {
    data: gear,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
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
              in: [
                "PLACED",
                "CONFIRMED",
                "PAID",
                "PICKED_UP",
              ],
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

export const getAllRentals = async (pagination: PaginationOptions) => {
  const { page, limit, skip } = pagination;

  const [rentals, total] = await prisma.$transaction([
    prisma.rentalOrder.findMany({
      skip,
      take: limit,
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
    }),

    prisma.rentalOrder.count(),
  ]);

  return {
    data: rentals,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const adminService = {
  getAllUsers,
  updateUserStatus,
  getAllGear,
  deleteGearAsAdmin,
  getAllRentals,
};
