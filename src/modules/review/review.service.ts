import prisma from "../../config/database.js";
import { AppError } from "../../middlewares/AppError.js";
import type { CreateReviewInput } from "./review.validation.js";

export const createReview = async (
  customerId: string,
  data: CreateReviewInput,
) => {
  const rentalOrder = await prisma.rentalOrder.findFirst({
    where: {
      id: data.rentalOrderId,
      customerId,
    },
    include: {
      rentalItems: {
        where: {
          gearItemId: data.gearItemId,
        },
      },
    },
  });

  if (!rentalOrder) {
    throw new AppError("Rental order not found", 404);
  }

  if (rentalOrder.status !== "RETURNED") {
    throw new AppError(
      "You can review gear only after the rental is returned",
      400,
    );
  }

  if (rentalOrder.rentalItems.length === 0) {
    throw new AppError(
      "This gear was not part of the rental order",
      400,
    );
  }

  const existingReview = await prisma.review.findUnique({
    where: {
      customerId_gearItemId: {
        customerId,
        gearItemId: data.gearItemId,
      },
    },
  });

  if (existingReview) {
    throw new AppError("You have already reviewed this gear", 409);
  }

  const review = await prisma.review.create({
    data: {
      customerId,
      gearItemId: data.gearItemId,
      rating: data.rating,
      comment: data.comment,
    },
    include: {
      gearItem: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return review;
};

export const getGearReviews = async (gearItemId: string) => {
  return prisma.review.findMany({
    where: {
      gearItemId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

export const reviewService = {
  createReview,
  getGearReviews,
};
