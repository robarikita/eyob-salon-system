import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/AppError";
import { verifyToken } from "../utils/jwt";
import { UserRole } from "@prisma/client";
import { logger } from "../utils/logger";
import prisma from "../utils/prisma";

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
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

    // Verify session validity and tokenVersion against database for session invalidation
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { tokenVersion: true },
    });

    if (!user || user.tokenVersion !== (payload.tokenVersion ?? 0)) {
      throw new UnauthorizedError("Session expired or token revoked");
    }

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

  const requestedBranchId =
    req.params.branchId ||
    (req.params.id && req.baseUrl.includes("branches") ? req.params.id : undefined) ||
    req.body.branchId ||
    req.query.branchId;

  if (requestedBranchId && requestedBranchId !== req.user.branchId) {
    return res.status(403).json({
      status: "error",
      message: "Forbidden: branch access denied",
    });
  }

  next();
};

export const requirePermission = (...permissionNames: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError("Not authenticated"));
    }

    // Owner has global bypass authority
    if (req.user.role === "OWNER") {
      return next();
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          role: true,
          roleId: true,
          customRole: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return res.status(403).json({
          status: "error",
          message: "Access denied: missing required permission",
        });
      }

      let userPermissions: string[] = [];

      if (user.customRole) {
        userPermissions = user.customRole.permissions.map((rp) => rp.permission.name);
      } else {
        const systemRole = await prisma.role.findUnique({
          where: { name: user.role },
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        });
        if (systemRole) {
          userPermissions = systemRole.permissions.map((rp) => rp.permission.name);
        }
      }

      const hasRequiredPermissions = permissionNames.every((perm) =>
        userPermissions.includes(perm)
      );

      if (!hasRequiredPermissions) {
        return res.status(403).json({
          status: "error",
          message: "Access denied: missing required permission",
        });
      }

      next();
    } catch (err) {
      logger.error({ err }, "Permission verification failed");
      return res.status(403).json({
        status: "error",
        message: "Access denied: missing required permission",
      });
    }
  };
};

