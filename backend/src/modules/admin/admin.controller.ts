import { Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";

export class AdminController {
  /**
   * GET /api/v1/admin/audit-logs
   * Protected: Requires view_audit_logs permission (OWNER passes automatically)
   */
  static async getAuditLogs(_req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await prisma.auditLog.findMany({
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      res.status(200).json({
        status: "success",
        data: logs,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/roles
   * Protected: OWNER & BRANCH_ADMIN
   */
  static async getRoles(_req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await prisma.role.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: { users: true },
          },
        },
        orderBy: { name: "asc" },
      });

      res.status(200).json({
        status: "success",
        data: roles,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/permissions
   * Protected: OWNER & BRANCH_ADMIN
   */
  static async getPermissions(_req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = await prisma.permission.findMany({
        orderBy: { name: "asc" },
      });

      res.status(200).json({
        status: "success",
        data: permissions,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/roles
   * Protected: OWNER only
   */
  static async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, branchId, permissionIds } = req.body;

      if (!name) {
        res.status(400).json({ status: "error", message: "Role name is required" });
        return;
      }

      const role = await prisma.role.create({
        data: {
          name: name.toUpperCase().replace(/\s+/g, "_"),
          description,
          branchId,
          isSystemRole: false,
          permissions: {
            create: Array.isArray(permissionIds)
              ? permissionIds.map((pId: string) => ({ permissionId: pId }))
              : [],
          },
        },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      });

      res.status(201).json({
        status: "success",
        data: role,
      });
    } catch (err: any) {
      if (err.code === "P2002") {
        res.status(409).json({ status: "error", message: "A role with this name already exists" });
        return;
      }
      next(err);
    }
  }

  /**
   * PATCH /api/v1/admin/roles/:id/permissions
   * Protected: OWNER only
   */
  static async updateRolePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { permissionIds } = req.body;

      if (!Array.isArray(permissionIds)) {
        res.status(400).json({ status: "error", message: "permissionIds must be an array" });
        return;
      }

      // Re-assign role permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      for (const pId of permissionIds) {
        await prisma.rolePermission.create({
          data: {
            roleId: id,
            permissionId: pId,
          },
        });
      }

      const updatedRole = await prisma.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      });

      res.status(200).json({
        status: "success",
        data: updatedRole,
      });
    } catch (err) {
      next(err);
    }
  }
}
