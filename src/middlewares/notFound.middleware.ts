import { Request, Response } from "express";
import { AppError } from "./AppError";

export const notFoundMiddleware = (req: Request, _res: Response) => {
  throw new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404);
};
