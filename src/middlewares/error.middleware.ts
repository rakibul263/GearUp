import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import { handlePrismaError } from "../utils/prisma-error.js";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });

    return;
  }

  try {
    handlePrismaError(error);
  } catch (mappedError) {
    if (mappedError instanceof AppError) {
      res.status(mappedError.statusCode).json({
        success: false,
        message: mappedError.message,
      });

      return;
    }

    error = mappedError;
  }

  console.error(error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
