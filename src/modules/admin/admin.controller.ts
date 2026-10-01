import type { Request, Response } from "express";
import { AppError } from "../../middlewares/AppError.js";
import { getAllUsers, updateUserStatus } from "./admin.service.js";

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

export const adminController = {
  getAllUsers: handleGetAllUsers,
  updateUserStatus: handleUpdateUserStatus,
};
