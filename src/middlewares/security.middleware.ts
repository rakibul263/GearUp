import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

/**
 * Enterprise-grade security headers middleware.
 * Implements OWASP recommended HTTP security response headers.
 */
export const securityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Prevent browsers from MIME-sniffing the response away from declared content-type
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking by disallowing framing
  res.setHeader("X-Frame-Options", "DENY");

  // Modern browsers disable legacy XSS auditors that could introduce vulnerabilities
  res.setHeader("X-XSS-Protection", "0");

  // Control referrer information sent in HTTP requests
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict browser features and APIs
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), camera=(), microphone=(), payment=()",
  );

  // Cross-Origin policies
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  // In production, enforce HTTPS Strict Transport Security for 1 year
  if (env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  // Content Security Policy allowing Swagger UI CDN assets while restricting arbitrary execution
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; font-src 'self' https: data:; connect-src 'self' https:;",
  );

  next();
};
