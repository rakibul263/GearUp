import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export const correlationIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const existingId = req.headers["x-request-id"];
  const requestId =
    typeof existingId === "string" && existingId.trim().length > 0
      ? existingId
      : crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  next();
};
