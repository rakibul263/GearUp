import type { RequestHandler } from "express";
import { UserRole } from "../../generated/prisma/enums.js";
import { AppError } from "./AppError.js";

export const requireRoles = (...allowedRoles: UserRole[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        "You do not have permission to access this resource",
        403,
      );
    }

    next();
  };
};
