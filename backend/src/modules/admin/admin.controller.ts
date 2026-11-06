import { Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import { hashPassword } from "../../utils/password";

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

  /**
   * GET /api/v1/admin/branch-admins
   * Protected: OWNER & BRANCH_ADMIN
   */
  static async getBranchAdmins(_req: Request, res: Response, next: NextFunction) {
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: "BRANCH_ADMIN",
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          branchId: true,
          branch: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
            },
          },
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
        orderBy: { createdAt: "desc" },
      });

      const systemAdminRole = await prisma.role.findUnique({
        where: { name: "BRANCH_ADMIN" },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      const formatted = admins.map((admin) => {
        const perms = admin.customRole?.permissions
          ? admin.customRole.permissions.map((rp) => rp.permission)
          : systemAdminRole?.permissions.map((rp) => rp.permission) || [];

        return {
          id: admin.id,
          name: `${admin.firstName} ${admin.lastName}`.trim(),
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          roleId: admin.customRole?.id || systemAdminRole?.id || null,
          roleName: admin.customRole?.name || "BRANCH_ADMIN",
          branch: admin.branch
            ? {
                id: admin.branch.id,
                name: admin.branch.name,
                slug: admin.branch.slug,
                isActive: admin.branch.isActive,
              }
            : null,
          permissions: perms,
        };
      });

      res.status(200).json({
        status: "success",
        data: formatted,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/users/:id/reset-password
   * Protected: OWNER only
   */
  static async resetUserPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 8) {
        res.status(400).json({ status: "error", message: "Password must be at least 8 characters" });
        return;
      }
      const hashedPassword = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: req.params.id as string },
        data: {
          password: hashedPassword,
          tokenVersion: { increment: 1 },
        },
      });
      res.status(200).json({ status: "success", message: "Password updated successfully" });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/admin/branch-admins/:id/permissions
   * Protected: OWNER only
   * Isolates permissions per branch administrator using branch-scoped custom role
   */
  static async updateAdminPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { permissionIds } = req.body;

      if (!Array.isArray(permissionIds)) {
        res.status(400).json({ status: "error", message: "permissionIds must be an array" });
        return;
      }

      const adminUser = await prisma.user.findUnique({
        where: { id },
        include: { branch: true, customRole: true },
      });

      if (!adminUser) {
        res.status(404).json({ status: "error", message: "Branch admin user not found" });
        return;
      }

      const branchSlug = adminUser.branch?.slug || adminUser.branchId || "custom";
      const scopedRoleName = `BRANCH_ADMIN_${branchSlug.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;

      // Find or create independent role for this branch admin
      let scopedRole = await prisma.role.findFirst({
        where: {
          OR: [
            { id: adminUser.roleId || undefined },
            { name: scopedRoleName },
          ],
          isSystemRole: false,
        },
      });

      if (!scopedRole) {
        scopedRole = await prisma.role.create({
          data: {
            name: scopedRoleName,
            description: `Scoped permissions for ${adminUser.branch?.name || "branch"} administrator`,
            branchId: adminUser.branchId,
            isSystemRole: false,
          },
        });
      }

      // Link user to this scoped role
      if (adminUser.roleId !== scopedRole.id) {
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { roleId: scopedRole.id },
        });
      }

      // Re-assign permissions on this scoped role
      await prisma.rolePermission.deleteMany({
        where: { roleId: scopedRole.id },
      });

      for (const pId of permissionIds) {
        await prisma.rolePermission.create({
          data: {
            roleId: scopedRole.id,
            permissionId: pId,
          },
        });
      }

      const updatedRole = await prisma.role.findUnique({
        where: { id: scopedRole.id },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      });

      res.status(200).json({
        status: "success",
        data: {
          userId: adminUser.id,
          roleId: scopedRole.id,
          roleName: scopedRole.name,
          permissions: updatedRole?.permissions.map((rp) => rp.permission) || [],
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
