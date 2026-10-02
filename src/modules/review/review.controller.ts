import type { Request, Response } from "express";
import { AppError } from "../../middlewares/AppError.js";
import { getPagination } from "../../utils/pagination.js";
import { createReview, getGearReviews } from "./review.service.js";

export const handleCreateReview = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const review = await createReview(req.user.userId, req.body);

  res.status(201).json({
    success: true,
    message: "Review created successfully",
    data: review,
  });
};

export const handleGetGearReviews = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { gearItemId } = req.params;

  if (typeof gearItemId !== "string" || gearItemId.length === 0) {
    throw new AppError("Invalid gear item id", 400);
  }

  const pagination = getPagination(req.query);
  const result = await getGearReviews(gearItemId, pagination);

  res.status(200).json({
    success: true,
    message: "Reviews fetched successfully",
    data: result.data,
    meta: result.meta,
  });
};

export const reviewController = {
  createReview: handleCreateReview,
  getGearReviews: handleGetGearReviews,
};
