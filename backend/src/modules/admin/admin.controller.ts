import { Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import { hashPassword } from "../../utils/password";
import { logger } from "../../utils/logger";
import { NotificationService } from "../notification/notification.service";
import { UnauthorizedError } from "../../errors/AppError";

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

  /**
   * GET /api/v1/admin/governance
   * List governance / approval requests
   */
  static async getGovernanceRequests(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const status = req.query.status as string | undefined;

      const where: any = {};
      if (status && status !== "ALL") {
        where.status = status;
      }

      if (req.user.role === "BRANCH_ADMIN") {
        where.branchId = req.user.branchId!;
      } // OWNER sees all

      const requests = await prisma.governanceRequest.findMany({
        where,
        include: {
          branch: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Enhance with requester name/email
      const userIds = Array.from(new Set(requests.map((r) => r.requestedBy).filter(Boolean)));
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      const enriched = requests.map((r) => ({
        ...r,
        requester: userMap.get(r.requestedBy) || {
          id: r.requestedBy,
          name: "Branch Admin",
        },
      }));

      res.status(200).json({
        success: true,
        count: enriched.length,
        data: enriched,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/governance/:id/review
   * Review governance proposal (Owner only)
   */
  static async reviewGovernanceRequest(req: Request, res: Response, _next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const id = req.params.id as string;
      const { decision, status, action, reviewNote } = req.body;
      const finalDecision = (decision || status || action || "").toUpperCase();

      if (
        finalDecision !== "APPROVE" &&
        finalDecision !== "APPROVED" &&
        finalDecision !== "REJECT" &&
        finalDecision !== "REJECTED"
      ) {
        res.status(400).json({ success: false, message: "Decision must be APPROVE or REJECT" });
        return;
      }

      const isApprove = finalDecision === "APPROVE" || finalDecision === "APPROVED";

      const govRequest = await prisma.governanceRequest.findUnique({
        where: { id },
        include: { branch: true },
      });

      if (!govRequest) {
        res.status(404).json({ success: false, message: "Governance request not found." });
        return;
      }

      if (govRequest.status !== "PENDING") {
        res.status(400).json({
          success: false,
          message: `Request has already been reviewed (${govRequest.status}).`,
        });
        return;
      }

      const payload: Record<string, any> =
        typeof govRequest.payload === "string"
          ? JSON.parse(govRequest.payload)
          : (govRequest.payload as Record<string, any> || {});

      const newStatus = isApprove ? "APPROVED" : "REJECTED";

      // 1. Execute database updates atomically in a Prisma transaction
      const updatedRequest = await prisma.$transaction(async (tx) => {
        const reqUpdated = await tx.governanceRequest.update({
          where: { id },
          data: {
            status: newStatus,
            reviewedBy: req.user!.id,
            reviewNote: reviewNote || null,
          },
        });

        // 2. Apply or reject changes based on request type
        if (isApprove) {
          if (govRequest.type === "CATEGORY_CREATION" && payload?.categoryId) {
            await tx.serviceCategory.update({
              where: { id: payload.categoryId },
              data: { status: "APPROVED" },
            });
          } else if (govRequest.type === "SERVICE_CREATION" && payload?.serviceId) {
            await tx.service.update({
              where: { id: payload.serviceId },
              data: { approvalStatus: "APPROVED" },
            });
          } else if (govRequest.type === "PRICE_UPDATE" && payload?.serviceId) {
            const rawPrice = Number(payload.proposedPrice !== undefined ? payload.proposedPrice : payload.customPrice);
            const safePrice = isNaN(rawPrice) ? 0 : Math.min(Math.max(0, rawPrice), 999999.99);
            const roundedPrice = Math.round(safePrice * 100) / 100;

            const depositInput = payload.proposedDepositValue !== undefined ? payload.proposedDepositValue : payload.depositValue;
            const depositTypeInput = payload.proposedDepositType || payload.depositType || null;

            let safeDeposit: number | null = null;
            if (depositInput !== undefined && depositInput !== null && depositInput !== "") {
              const rawDep = Number(depositInput);
              if (!isNaN(rawDep)) {
                const maxDep = depositTypeInput === "PERCENTAGE" ? 100 : 999999.99;
                safeDeposit = Math.round(Math.min(Math.max(0, rawDep), maxDep) * 100) / 100;
              }
            }

            const rawDuration = payload.proposedDuration !== undefined ? payload.proposedDuration : payload.customDurationMinutes;
            const safeDuration = rawDuration ? parseInt(String(rawDuration), 10) : null;

            // Upsert branch price
            await tx.branchServicePrice.upsert({
              where: {
                branchId_serviceId: {
                  branchId: govRequest.branchId,
                  serviceId: payload.serviceId,
                },
              },
              update: {
                customPrice: roundedPrice,
                customDurationMinutes: safeDuration,
                depositType: depositTypeInput,
                depositValue: safeDeposit,
                isActive: true,
              },
              create: {
                branchId: govRequest.branchId,
                serviceId: payload.serviceId,
                customPrice: roundedPrice,
                customDurationMinutes: safeDuration,
                depositType: depositTypeInput,
                depositValue: safeDeposit,
                isActive: true,
              },
            });

            // Log to price history
            await tx.servicePriceHistory.create({
              data: {
                serviceId: payload.serviceId,
                branchId: govRequest.branchId,
                price: roundedPrice,
                changedBy: req.user!.id,
                reason: `Approved branch proposal: ${govRequest.reason || "Price override"}`,
              },
            });
          } else if (govRequest.type === "BRANCH_SERVICE_DEACTIVATION" && payload?.serviceId) {
            await tx.branchServicePrice.upsert({
              where: {
                branchId_serviceId: {
                  branchId: govRequest.branchId,
                  serviceId: payload.serviceId,
                },
              },
              update: { isActive: false },
              create: {
                branchId: govRequest.branchId,
                serviceId: payload.serviceId,
                customPrice: payload.customPrice ? Math.round(Math.min(Math.max(0, Number(payload.customPrice)), 999999.99) * 100) / 100 : 0,
                isActive: false,
              },
            });
          }
        } else {
          // Rejected
          if (govRequest.type === "CATEGORY_CREATION" && payload?.categoryId) {
            await tx.serviceCategory.update({
              where: { id: payload.categoryId },
              data: { status: "REJECTED" },
            });
          } else if (govRequest.type === "SERVICE_CREATION" && payload?.serviceId) {
            await tx.service.update({
              where: { id: payload.serviceId },
              data: { approvalStatus: "REJECTED" },
            });
          }
        }

        return reqUpdated;
      });

      // 3. Notify the requesting Branch Admin
      let notifTitle = isApprove ? "Request Approved / ጸድቋል" : "Request Rejected / ውድቅ ተደርጓል";
      let notifMessage = isApprove
        ? `Your proposal (${govRequest.type}) for ${govRequest.branch.name} was approved by Owner.`
        : `Your proposal (${govRequest.type}) was rejected. Note: ${reviewNote || "No note provided"}.`;

      if (govRequest.type === "PRICE_UPDATE" && payload?.serviceId) {
        const targetService = await prisma.service.findUnique({ where: { id: payload.serviceId } });
        const serviceName = targetService?.name || "service";
        notifTitle = isApprove ? "Price Approved / ጸድቋል" : "Price Declined / ውድቅ ተደርጓል";
        notifMessage = isApprove
          ? `Your price request for ${serviceName} was approved: ${reviewNote || "Approved by Owner"}`
          : `Your price request for ${serviceName} was declined: ${reviewNote || govRequest.reason}`;
      } else if (govRequest.type === "BRANCH_SERVICE_DEACTIVATION" && payload?.serviceId) {
        const targetService = await prisma.service.findUnique({ where: { id: payload.serviceId } });
        const serviceName = targetService?.name || "service";
        notifTitle = isApprove ? "Deactivation Approved / ጸድቋል" : "Deactivation Declined / ውድቅ ተደርጓል";
        notifMessage = isApprove
          ? `Your deactivation request for ${serviceName} at ${govRequest.branch.name} was approved.`
          : `Your deactivation request for ${serviceName} was declined: ${reviewNote || govRequest.reason}`;
      }

      await NotificationService.createNotification({
        userId: govRequest.requestedBy,
        branchId: govRequest.branchId,
        title: notifTitle,
        message: notifMessage,
        type: "APPROVAL_NOTICE",
        link: "/admin/services",
      });

      res.status(200).json({
        success: true,
        message: `Governance request ${newStatus.toLowerCase()} successfully`,
        data: updatedRequest,
      });
    } catch (err: any) {
      logger.error({ err }, "Governance review failed");
      res.status(500).json({
        success: false,
        message: err?.message || "Failed to process governance review",
      });
    }
  }
}
