import type { Request, Response } from "express";
import { AppError } from "../../middlewares/AppError.js";
import { getPagination } from "../../utils/pagination.js";
import {
  deleteGearAsAdmin,
  getAllGear,
  getAllRentals,
  getAllUsers,
  updateUserStatus,
} from "./admin.service.js";

export const handleGetAllUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const pagination = getPagination(req.query);
  const result = await getAllUsers(pagination);

  res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    data: result.data,
    meta: result.meta,
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
  req: Request,
  res: Response,
): Promise<void> => {
  const pagination = getPagination(req.query);
  const result = await getAllGear(pagination);

  res.status(200).json({
    success: true,
    message: "Gear items fetched successfully",
    data: result.data,
    meta: result.meta,
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
  req: Request,
  res: Response,
): Promise<void> => {
  const pagination = getPagination(req.query);
  const result = await getAllRentals(pagination);

  res.status(200).json({
    success: true,
    message: "Rental orders fetched successfully",
    data: result.data,
    meta: result.meta,
  });
};

export const handleReconcileRefunds = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const { reconcilePendingRefunds } = await import(
    "../payment/payment.refund.reconcile.js"
  );
  const report = await reconcilePendingRefunds();

  res.status(200).json({
    success: true,
    message: "Refund reconciliation executed successfully",
    data: report,
  });
};

export const adminController = {
  getAllUsers: handleGetAllUsers,
  updateUserStatus: handleUpdateUserStatus,
  getAllGear: handleGetAllGear,
  deleteGearAsAdmin: handleDeleteGearAsAdmin,
  getAllRentals: handleGetAllRentals,
  reconcileRefunds: handleReconcileRefunds,
};
