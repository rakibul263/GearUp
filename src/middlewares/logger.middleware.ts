import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl, requestId } = req;
    const { statusCode } = res;

    if (env.NODE_ENV === "production") {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: statusCode >= 500 ? "ERROR" : statusCode >= 400 ? "WARN" : "INFO",
        requestId: requestId || null,
        method,
        url: originalUrl,
        statusCode,
        durationMs: duration,
        ip: req.socket.remoteAddress || null,
      };

      if (statusCode >= 500) {
        console.error(JSON.stringify(logEntry));
      } else {
        console.log(JSON.stringify(logEntry));
      }
    } else {
      const reqIdTag = requestId ? `[${requestId.slice(0, 8)}] ` : "";
      const logMessage = `${reqIdTag}[${method}] ${originalUrl} - ${statusCode} (${duration}ms)`;

      if (statusCode >= 500) {
        console.error(`🔴 ${logMessage}`);
      } else if (statusCode >= 400) {
        console.warn(`🟡 ${logMessage}`);
      } else {
        console.log(`🟢 ${logMessage}`);
      }
    }
  });

  next();
};
