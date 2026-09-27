import { Request, Response } from "express";

import { AppError } from "../../middlewares/AppError.js";
import { categoryService } from "./category.service.js";

const getCategoryParamId = (req: Request): string => {
  const { id } = req.params;

  if (typeof id !== "string" || id.length === 0) {
    throw new AppError("Invalid category id", 400);
  }

  return id;
};

const createCategory = async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: category,
  });
};

const getCategories = async (_req: Request, res: Response) => {
  const categories = await categoryService.getCategories();

  res.status(200).json({
    success: true,
    message: "Categories fetched successfully",
    data: categories,
  });
};

const getCategoryById = async (req: Request, res: Response) => {
  const category = await categoryService.getCategoryById(
    getCategoryParamId(req),
  );

  res.status(200).json({
    success: true,
    message: "Category fetched successfully",
    data: category,
  });
};

const updateCategory = async (req: Request, res: Response) => {
  const category = await categoryService.updateCategory(
    getCategoryParamId(req),
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: category,
  });
};

const deleteCategory = async (req: Request, res: Response) => {
  await categoryService.deleteCategory(getCategoryParamId(req));

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
};

export const categoryController = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
