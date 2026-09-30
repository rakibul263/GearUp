import { Request, Response } from "express";

import { rentalService } from "./rental.service.js";
import { AppError } from "../../middlewares/AppError.js";

const getRentalParamId = (req: Request): string => {
  const { id } = req.params;

  if (typeof id !== "string" || id.length === 0) {
    throw new AppError("Invalid rental order id", 400);
  }

  return id;
};

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
    getRentalParamId(req),
    req.user.userId,
  );

  res.status(200).json({
    success: true,
    message: "Rental order fetched successfully",
    data: rental,
  });
};

const cancelRental = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const rental = await rentalService.cancelRental(
    getRentalParamId(req),
    req.user.userId,
  );

  res.status(200).json({
    success: true,
    message: "Rental order cancelled successfully",
    data: rental,
  });
};
const getProviderRentals = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const rentals = await rentalService.getProviderRentals(req.user.userId);

  res.status(200).json({
    success: true,
    message: "Provider rental orders fetched successfully",
    data: rentals,
  });
};

const updateProviderRentalStatus = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const rental = await rentalService.updateProviderRentalStatus(
    getRentalParamId(req),
    req.user.userId,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Rental status updated successfully",
    data: rental,
  });
};

export const rentalController = {
  createRental,
  getMyRentals,
  getRentalById,
  cancelRental,
  updateProviderRentalStatus,
  getProviderRentals,
};
