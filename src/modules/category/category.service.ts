import prisma from "../../config/database.js";
import { AppError } from "../../middlewares/AppError.js";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category.validation.js";

const createCategory = async (data: CreateCategoryInput) => {
  const existingCategory = await prisma.category.findFirst({
    where: {
      OR: [
        {
          name: data.name,
        },
        {
          slug: data.slug,
        },
      ],
    },
  });

  if (existingCategory) {
    throw new AppError(
      "Category with this name or slug already exists",
      409,
    );
  }

  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
    },
  });
  return category;
};

const getCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      _count: {
        select: {
          gearItems: true,
        },
      },
    },
  });
  return categories;
};

const getCategoryById = async (categoryId: string) => {
  const existingCategory = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
    include: {
      _count: {
        select: {
          gearItems: true,
        },
      },
    },
  });

  if (!existingCategory) {
    throw new AppError("Category not found.", 404);
  }

  return existingCategory;
};

const updateCategory = async (
  categoryId: string,
  data: UpdateCategoryInput,
) => {
  const existingCategory = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
  });

  if (!existingCategory) {
    throw new AppError("Category not found", 404);
  }

  if (data.name || data.slug) {
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        OR: [
          data.name
            ? {
                name: data.name,
              }
            : undefined,
          data.slug
            ? {
                slug: data.slug,
              }
            : undefined,
        ].filter(Boolean) as {
          name?: string;
          slug?: string;
        }[],
        NOT: {
          id: categoryId,
        },
      },
    });

    if (duplicateCategory) {
      throw new AppError("Category with this name or slug already exists", 409);
    }
  }

  const category = await prisma.category.update({
    where: {
      id: categoryId,
    },
    data,
  });

  return category;
};

const deleteCategory = async (categoryId: string) => {
  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
    include: {
      _count: {
        select: {
          gearItems: true,
        },
      },
    },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  if (category._count.gearItems > 0) {
    throw new AppError(
      "Cannot delete a category that contains gear items",
      409,
    );
  }

  await prisma.category.delete({
    where: {
      id: categoryId,
    },
  });
};

export const categoryService = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
