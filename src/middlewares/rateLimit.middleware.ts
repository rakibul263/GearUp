import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  const store = new Map<string, RateLimitRecord>();
  const { windowMs, max, message = "Too many requests, please try again later" } =
    options;

  const pruneExpired = (now: number) => {
    if (store.size > 500) {
      for (const [key, record] of store.entries()) {
        if (now > record.resetTime) {
          store.delete(key);
        }
      }
    }
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    pruneExpired(now);
    const forwarded = req.headers["x-forwarded-for"];
    const ip =
      (typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : null) ||
      req.socket.remoteAddress ||
      "unknown-ip";

    let record = store.get(ip);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(ip, record);
    } else {
      record.count++;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", resetSeconds);

    if (record.count > max) {
      res.setHeader("Retry-After", resetSeconds);
      throw new AppError(message, 429);
    }

    next();
  };
};

// Global API rate limiter: 100 requests per 15 minutes
export const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP address, please try again after 15 minutes",
});

// Sensitive Auth endpoint limiter: 10 requests per 15 minutes to prevent brute-force attacks
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts. Please wait 15 minutes before trying again.",
});

// Payment & Refund operations limiter: 25 requests per 15 minutes
export const paymentLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: "Too many payment requests from this IP. Please try again shortly.",
});
