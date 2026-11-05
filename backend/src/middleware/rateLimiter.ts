import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

/**
 * Strict Login Rate Limiter:
 * Maximum 5 failed attempts per 15-minute window per IP.
 * Successful logins do NOT increment or count against the limit (skipSuccessfulRequests: true).
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 failed attempts
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  keyGenerator: (req: Request) => {
    return (req.headers["x-test-ip"] as string) || (req.headers["x-forwarded-for"] as string) || req.ip || "127.0.0.1";
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      status: "error",
      message: "Too many failed login attempts from this IP. Please try again after 15 minutes.",
    });
  },
});

/**
 * General Auth Rate Limiter:
 * Maximum 10 requests per 15 minutes per IP for sensitive auth operations
 * like forgot-password and register.
 */
export const generalAuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  keyGenerator: (req: Request) => {
    return (req.headers["x-test-ip"] as string) || (req.headers["x-forwarded-for"] as string) || req.ip || "127.0.0.1";
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      status: "error",
      message: "Too many authentication requests from this IP. Please try again after 15 minutes.",
    });
  },
});
