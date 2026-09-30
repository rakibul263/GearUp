import { Request, Response } from "express";

import { rentalService } from "./rental.service.js";
import { AppError } from "../../middlewares/AppError.js";

const createRental = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const rental = await rentalService.createRental(req.user.userId, req.body);

  res.status(201).json({
    success: true,
    message: "Rental order created successfully",
    data: rental,
  });
};

const getMyRentals = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const rentals = await rentalService.getCustomerRentals(req.user.userId);

  res.status(200).json({
    success: true,
    message: "Rental orders fetched successfully",
    data: rentals,
  });
};

const getRentalById = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const rental = await rentalService.getRentalById(
    req.params.id as string,
    req.user.userId,
  );

  res.status(200).json({
    success: true,
    message: "Rental order fetched successfully",
    data: rental,
  });
};

export const rentalController = {
  createRental,
  getMyRentals,
  getRentalById,
};
