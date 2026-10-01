import type { Request, Response } from "express";
import { AppError } from "../../middlewares/AppError.js";
import {
  deleteGearAsAdmin,
  getAllGear,
  getAllRentals,
  getAllUsers,
  updateUserStatus,
} from "./admin.service.js";

export const handleGetAllUsers = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const users = await getAllUsers();

  res.status(200).json({
    success: true,
    data: users,
  });
};

export const handleUpdateUserStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const { id } = req.params;

  if (typeof id !== "string" || id.length === 0) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await updateUserStatus(req.user.userId, id, req.body);

  res.status(200).json({
    success: true,
    message: "User status updated successfully",
    data: user,
  });
};

export const handleGetAllGear = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const gear = await getAllGear();

  res.status(200).json({
    success: true,
    data: gear,
  });
};

export const handleDeleteGearAsAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  if (typeof id !== "string" || id.length === 0) {
    throw new AppError("Invalid gear id", 400);
  }

  await deleteGearAsAdmin(id);

  res.status(200).json({
    success: true,
    message: "Gear deleted successfully",
  });
};

export const handleGetAllRentals = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const rentals = await getAllRentals();

  res.status(200).json({
    success: true,
    data: rentals,
  });
};

export const adminController = {
  getAllUsers: handleGetAllUsers,
  updateUserStatus: handleUpdateUserStatus,
  getAllGear: handleGetAllGear,
  deleteGearAsAdmin: handleDeleteGearAsAdmin,
  getAllRentals: handleGetAllRentals,
};
