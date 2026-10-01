import type { Request, Response, NextFunction } from "express";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    const logMessage = `[${method}] ${originalUrl} - ${statusCode} (${duration}ms)`;

    if (statusCode >= 500) {
      console.error(`🔴 ${logMessage}`);
    } else if (statusCode >= 400) {
      console.warn(`🟡 ${logMessage}`);
    } else {
      console.log(`🟢 ${logMessage}`);
    }
  });

  next();
};

