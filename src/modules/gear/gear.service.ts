import type { Prisma } from "../../../generated/prisma/client.js";
import prisma from "../../config/database.js";
import { AppError } from "../../middlewares/AppError.js";
import { getPagination } from "../../utils/pagination.js";

import type {
  CreateGearInput,
  GearListQuery,
  UpdateGearInput,
} from "./gear.validation.js";

const createGear = async (providerId: string, data: CreateGearInput) => {
  const category = await prisma.category.findUnique({
    where: {
      id: data.categoryId,
    },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const existingGear = await prisma.gear.findFirst({
    where: {
      slug: data.slug,
    },
  });

  if (existingGear) {
    throw new AppError("Gear with this slug already exists", 409);
  }

  const gear = await prisma.gear.create({
    data: {
      providerId,
      categoryId: data.categoryId,
      name: data.name,
      slug: data.slug,
      description: data.description,
      brand: data.brand,
      pricePerDay: data.pricePerDay,
      stock: data.stock,
      imageUrl: data.imageUrl,
      specifications: data.specifications as unknown as Prisma.InputJsonValue,
      isAvailable: data.isAvailable,
    },
    include: {
      category: true,
    },
  });

  return gear;
};

const getGears = async (query: GearListQuery) => {
  const { page, limit, skip } = getPagination(query);

  const where = {
    ...(query.search
      ? {
          OR: [
            {
              name: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
            {
              description: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
            {
              brand: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),

    ...(query.categoryId
      ? {
          categoryId: query.categoryId,
        }
      : {}),

    ...(query.brand
      ? {
          brand: {
            equals: query.brand,
            mode: "insensitive" as const,
          },
        }
      : {}),

    ...(query.isAvailable
      ? {
          isAvailable: query.isAvailable === "true",
        }
      : {}),
  };

  const [gears, total] = await Promise.all([
    prisma.gear.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

    prisma.gear.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: gears,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

const getGearById = async (gearId: string) => {
  const gear = await prisma.gear.findUnique({
    where: {
      id: gearId,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
        },
      },
      provider: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!gear) {
    throw new AppError("Gear not found", 404);
  }

  return gear;
};

const updateGear = async (
  gearId: string,
  providerId: string,
  data: UpdateGearInput,
) => {
  const gear = await prisma.gear.findUnique({
    where: {
      id: gearId,
    },
  });

  if (!gear) {
    throw new AppError("Gear not found", 404);
  }

  if (gear.providerId !== providerId) {
    throw new AppError("You can only modify your own gear", 403);
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: {
        id: data.categoryId,
      },
    });

    if (!category) {
      throw new AppError("Category not found", 404);
    }
  }

  if (data.slug && data.slug !== gear.slug) {
    const existingGear = await prisma.gear.findFirst({
      where: {
        slug: data.slug,
        NOT: {
          id: gearId,
        },
      },
    });

    if (existingGear) {
      throw new AppError("Gear with this slug already exists", 409);
    }
  }

  const { specifications, ...rest } = data;

  const updatedGear = await prisma.gear.update({
    where: {
      id: gearId,
    },
    data: {
      ...rest,
      ...(specifications !== undefined
        ? {
            specifications: specifications as unknown as Prisma.InputJsonValue,
          }
        : {}),
    },
    include: {
      category: true,
    },
  });

  return updatedGear;
};

const deleteGear = async (gearId: string, providerId: string) => {
  const gear = await prisma.gear.findUnique({
    where: {
      id: gearId,
    },
    include: {
      _count: {
        select: {
          rentalItems: true,
        },
      },
    },
  });

  if (!gear) {
    throw new AppError("Gear not found", 404);
  }

  if (gear.providerId !== providerId) {
    throw new AppError("You can only delete your own gear", 403);
  }

  if (gear._count.rentalItems > 0) {
    throw new AppError("Cannot delete gear with rental history", 409);
  }

  await prisma.gear.delete({
    where: {
      id: gearId,
    },
  });
};

export const gearService = {
  createGear,
  getGears,
  getGearById,
  updateGear,
  deleteGear,
};
