import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/AppError";
import { verifyToken } from "../utils/jwt";
import { UserRole } from "@prisma/client";
import { logger } from "../utils/logger";

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new UnauthorizedError("Authentication token is missing");
    }

    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    logger.error({ error }, "Authentication failed");
    next(new UnauthorizedError("Invalid or expired token"));
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError("Not authenticated"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden: insufficient permissions",
      });
    }

    next();
  };
};

export const requireBranchAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new UnauthorizedError("Not authenticated"));
  }

  // Owner can access all branches
  if (req.user.role === "OWNER") {
    return next();
  }

  const requestedBranchId = req.params.branchId || req.body.branchId || req.query.branchId;

  if (requestedBranchId && requestedBranchId !== req.user.branchId) {
    return res.status(403).json({
      status: "error",
      message: "Forbidden: branch access denied",
    });
  }

  next();
};
