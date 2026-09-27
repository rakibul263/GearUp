import type { RequestHandler } from "express";

import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "./AppError.js";

export const authMiddleware: RequestHandler = (req, _res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    throw new AppError("Authentication required", 401);
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError("Invalid authorization header", 401);
  }

  try {
    const payload = verifyAccessToken(token);

    if (!payload.userId || !payload.role) {
      throw new AppError("Invalid access token", 401);
    }

    req.user = {
      userId: payload.userId,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Invalid or expired access token", 401);
  }
};
