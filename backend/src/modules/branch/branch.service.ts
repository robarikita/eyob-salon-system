import prisma from "../../utils/prisma";
import { UserRole } from "@prisma/client";
import { ValidationError, NotFoundError } from "../../errors/AppError";
import { hashPassword } from "../../utils/password";
import { z } from "zod";
import {
  createBranchSchema,
  updateBranchSchema,
  updateBusinessHoursSchema,
  normalizeDayOfWeek,
  getDayName,
} from "./branch.schema";

type CreateBranchInput = z.infer<typeof createBranchSchema>;
type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
type UpdateBusinessHoursInput = z.infer<typeof updateBusinessHoursSchema>;

export class BranchService {
  static async createBranch(data: CreateBranchInput) {
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const existingBranch = await prisma.branch.findUnique({
      where: { slug },
    });

    if (existingBranch) {
      throw new ValidationError(`Branch slug "${slug}" is already in use.`);
    }

    const phoneNumber = data.phoneNumber || data.phone || "";
    const addressLine = data.addressLine || data.address || "";

    return prisma.$transaction(async (tx) => {
      const branch = await tx.branch.create({
        data: {
          name: data.name,
          slug,
          phoneNumber,
          addressLine,
          city: data.city || "Addis Ababa",
          description: data.description || null,
          timezone: data.timezone || "Africa/Addis_Ababa",
          slotBufferMinutes: data.slotBufferMinutes ?? 10,
          isActive: true,
        },
      });

      // Default 7-day operating hours (09:00 - 20:00)
      const defaultHours = Array.from({ length: 7 }, (_, i) => ({
        branchId: branch.id,
        dayOfWeek: i,
        openTime: "09:00",
        closeTime: "20:00",
        closesNextDay: false,
        isClosed: false,
      }));

      await tx.branchHours.createMany({
        data: defaultHours,
      });

      let adminUser = null;
      if (data.admin) {
        const existingUser = await tx.user.findFirst({
          where: {
            OR: [
              { email: data.admin.email.toLowerCase() },
              { phone: data.admin.phone },
            ],
          },
        });

        if (existingUser) {
          throw new ValidationError(
            `Admin user with email "${data.admin.email}" or phone "${data.admin.phone}" already exists.`
          );
        }

        const hashedPassword = await hashPassword(data.admin.password);

        let branchAdminRole = await tx.role.findUnique({
          where: { name: "BRANCH_ADMIN" },
        });

        if (!branchAdminRole) {
          branchAdminRole = await tx.role.create({
            data: {
              name: "BRANCH_ADMIN",
              description: "Branch Administrator with local authority",
              isSystemRole: true,
            },
          });
        }

        const nameParts = data.admin.name.trim().split(/\s+/);
        const firstName = nameParts[0] || "Branch";
        const lastName = nameParts.slice(1).join(" ") || "Admin";

        const user = await tx.user.create({
          data: {
            firstName,
            lastName,
            email: data.admin.email.toLowerCase(),
            phone: data.admin.phone,
            password: hashedPassword,
            role: "BRANCH_ADMIN",
            roleId: branchAdminRole.id,
            branchId: branch.id,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            branchId: true,
          },
        });

        adminUser = {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          phone: user.phone,
        };
      }

      return {
        ...branch,
        phone: branch.phoneNumber,
        address: branch.addressLine,
        admin: adminUser,
      };
    });
  }

  static async getAllBranches(userRole?: UserRole) {
    if (userRole === "OWNER" || userRole === "BRANCH_ADMIN") {
      const branches = await prisma.branch.findMany({
        include: {
          _count: {
            select: { employees: true, services: true, bookings: true },
          },
          users: {
            where: { role: "BRANCH_ADMIN" },
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
          branchHours: {
            orderBy: { dayOfWeek: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return branches.map((b) => ({
        ...b,
        phone: b.phoneNumber,
        address: b.addressLine,
        admin: b.users[0]
          ? {
              id: b.users[0].id,
              name: `${b.users[0].firstName} ${b.users[0].lastName}`.trim(),
              email: b.users[0].email,
              phone: b.users[0].phone,
            }
          : null,
      }));
    }

    // Public / Customer / Employee view
    const branches = await prisma.branch.findMany({
      include: {
        branchHours: {
          orderBy: { dayOfWeek: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return branches.map((b) => ({
      ...b,
      phone: b.phoneNumber,
      address: b.addressLine,
    }));
  }

  static async getBranchById(id: string) {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        branchHours: {
          orderBy: { dayOfWeek: "asc" },
        },
        users: {
          where: { role: "BRANCH_ADMIN" },
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
      },
    });

    if (!branch) {
      throw new NotFoundError("Branch not found");
    }

    return {
      ...branch,
      phone: branch.phoneNumber,
      address: branch.addressLine,
      admin: branch.users[0]
        ? {
            id: branch.users[0].id,
            name: `${branch.users[0].firstName} ${branch.users[0].lastName}`.trim(),
            email: branch.users[0].email,
            phone: branch.users[0].phone,
          }
        : null,
    };
  }

  static async updateBranch(id: string, data: UpdateBranchInput) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundError("Branch not found");

    if (data.slug && data.slug !== branch.slug) {
      const existingBranch = await prisma.branch.findUnique({ where: { slug: data.slug } });
      if (existingBranch) {
        throw new ValidationError("Branch slug must be unique");
      }
    }

    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.slug !== undefined) updatePayload.slug = data.slug;
    if (data.city !== undefined) updatePayload.city = data.city;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.timezone !== undefined) updatePayload.timezone = data.timezone;
    if (data.slotBufferMinutes !== undefined) updatePayload.slotBufferMinutes = data.slotBufferMinutes;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

    if (data.phoneNumber !== undefined || data.phone !== undefined) {
      updatePayload.phoneNumber = data.phoneNumber || data.phone;
    }
    if (data.addressLine !== undefined || data.address !== undefined) {
      updatePayload.addressLine = data.addressLine || data.address;
    }

    if (data.admin) {
      const existingAdmin = await prisma.user.findFirst({
        where: { branchId: id, role: "BRANCH_ADMIN" },
      });

      const adminUpdate: any = {};
      if (data.admin.name) {
        const nameParts = data.admin.name.trim().split(/\s+/);
        adminUpdate.firstName = nameParts[0] || "Branch";
        adminUpdate.lastName = nameParts.slice(1).join(" ") || "Admin";
      }
      if (data.admin.email) {
        adminUpdate.email = data.admin.email.toLowerCase().trim();
      }
      if (data.admin.phone) {
        adminUpdate.phone = data.admin.phone.trim();
      }
      if (data.admin.password) {
        adminUpdate.password = await hashPassword(data.admin.password);
        adminUpdate.tokenVersion = { increment: 1 };
      }

      if (existingAdmin) {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: adminUpdate,
        });
      } else if (data.admin.name && data.admin.email && data.admin.phone) {
        let branchAdminRole = await prisma.role.findUnique({
          where: { name: "BRANCH_ADMIN" },
        });
        if (!branchAdminRole) {
          branchAdminRole = await prisma.role.create({
            data: {
              name: "BRANCH_ADMIN",
              description: "Branch Administrator with local authority",
              isSystemRole: true,
            },
          });
        }
        const hashedPassword = data.admin.password
          ? await hashPassword(data.admin.password)
          : await hashPassword("Default@123");

        const nameParts = data.admin.name.trim().split(/\s+/);
        await prisma.user.create({
          data: {
            firstName: nameParts[0] || "Branch",
            lastName: nameParts.slice(1).join(" ") || "Admin",
            email: data.admin.email.toLowerCase().trim(),
            phone: data.admin.phone.trim(),
            password: hashedPassword,
            role: "BRANCH_ADMIN",
            roleId: branchAdminRole.id,
            branchId: id,
          },
        });
      }
    }

    const updated = await prisma.branch.update({
      where: { id },
      data: updatePayload,
      include: {
        users: {
          where: { role: "BRANCH_ADMIN" },
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
      },
    });

    return {
      ...updated,
      phone: updated.phoneNumber,
      address: updated.addressLine,
      admin: updated.users[0]
        ? {
            id: updated.users[0].id,
            name: `${updated.users[0].firstName} ${updated.users[0].lastName}`.trim(),
            email: updated.users[0].email,
            phone: updated.users[0].phone,
          }
        : null,
    };
  }

  static async deleteBranch(id: string) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundError("Branch not found");

    const updated = await prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });

    // Revoke / cancel active bookings for this branch
    await prisma.booking.updateMany({
      where: {
        branchId: id,
        status: { in: ["PENDING_PAYMENT", "CONFIRMED"] },
      },
      data: {
        status: "CANCELLED",
        cancellationReason: "Branch permanently or temporarily closed by salon administration.",
      },
    });

    return {
      success: true,
      message: `Branch "${branch.name}" successfully deactivated and archived.`,
      data: {
        id: updated.id,
        name: updated.name,
        isActive: false,
      },
    };
  }

  static async permanentDeleteBranch(id: string) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundError("Branch not found");

    return prisma.$transaction(async (tx) => {
      // 1. Find all bookings for this branch
      const branchBookings = await tx.booking.findMany({
        where: { branchId: id },
        select: { id: true },
      });
      const bookingIds = branchBookings.map((b) => b.id);

      if (bookingIds.length > 0) {
        // Delete payment webhook logs for these bookings
        await tx.paymentWebhookLog.deleteMany({
          where: { payment: { bookingId: { in: bookingIds } } },
        });
        // Delete payments for these bookings
        await tx.payment.deleteMany({
          where: { bookingId: { in: bookingIds } },
        });
        // Delete reviews on booking items for these bookings
        await tx.review.deleteMany({
          where: { bookingItem: { bookingId: { in: bookingIds } } },
        });
        // Delete booking items
        await tx.bookingItem.deleteMany({
          where: { bookingId: { in: bookingIds } },
        });
        // Delete bookings
        await tx.booking.deleteMany({
          where: { id: { in: bookingIds } },
        });
      }

      // 2. Clear employee associations
      const branchEmployees = await tx.employee.findMany({
        where: { branchId: id },
        select: { id: true },
      });
      const employeeIds = branchEmployees.map((e) => e.id);
      if (employeeIds.length > 0) {
        await tx.bookingItem.updateMany({
          where: { employeeId: { in: employeeIds } },
          data: { employeeId: null },
        });
        await tx.scheduleException.deleteMany({
          where: { employeeId: { in: employeeIds } },
        });
        await tx.employeeSchedule.deleteMany({
          where: { employeeId: { in: employeeIds } },
        });
        await tx.employeeService.deleteMany({
          where: { employeeId: { in: employeeIds } },
        });
        await tx.employee.deleteMany({
          where: { branchId: id },
        });
      }

      // 3. Delete branch-specific services and branchService joins
      await tx.branchServicePrice.deleteMany({
        where: { branchId: id },
      });
      await tx.servicePriceHistory.deleteMany({
        where: { branchId: id },
      });
      await tx.branchService.deleteMany({
        where: { branchId: id },
      });
      await tx.service.deleteMany({
        where: { branchId: id },
      });

      // 4. Delete branch operating hours
      await tx.branchHours.deleteMany({
        where: { branchId: id },
      });

      // 5. Handle branch-scoped roles
      const branchRoles = await tx.role.findMany({
        where: { branchId: id },
        select: { id: true },
      });
      const roleIds = branchRoles.map((r) => r.id);
      if (roleIds.length > 0) {
        await tx.user.updateMany({
          where: { roleId: { in: roleIds } },
          data: { roleId: null },
        });
        await tx.rolePermission.deleteMany({
          where: { roleId: { in: roleIds } },
        });
        await tx.role.deleteMany({
          where: { branchId: id },
        });
      }

      // 6. Unlink users assigned to this branch
      await tx.user.updateMany({
        where: { branchId: id },
        data: { branchId: null },
      });

      // 7. Delete the branch itself
      await tx.branch.delete({
        where: { id },
      });

      return {
        success: true,
        message: `Branch "${branch.name}" permanently deleted and removed from the system.`,
        data: {
          id: branch.id,
          name: branch.name,
        },
      };
    });
  }

  static async toggleBranchStatus(id: string, isActive?: boolean) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundError("Branch not found");

    const newStatus = typeof isActive === "boolean" ? isActive : !branch.isActive;

    const updated = await prisma.branch.update({
      where: { id },
      data: { isActive: newStatus },
    });

    return {
      ...updated,
      phone: updated.phoneNumber,
      address: updated.addressLine,
    };
  }

  static async assignBranchAdmin(branchId: string, userId: string) {
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundError("Branch not found");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");

    const branchAdminRole = await prisma.role.findUnique({
      where: { name: "BRANCH_ADMIN" },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        branchId,
        role: "BRANCH_ADMIN",
        ...(branchAdminRole ? { roleId: branchAdminRole.id } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
      },
    });

    return {
      ...updatedUser,
      name: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
    };
  }

  static async getBranchHours(branchId: string) {
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundError("Branch not found");

    const hours = await prisma.branchHours.findMany({
      where: { branchId },
      orderBy: { dayOfWeek: "asc" },
    });

    return hours.map((h) => ({
      ...h,
      dayName: getDayName(h.dayOfWeek),
    }));
  }

  static async setBranchHours(branchId: string, hoursInput: UpdateBusinessHoursInput) {
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundError("Branch not found");

    const hoursArray = Array.isArray(hoursInput) ? hoursInput : [hoursInput];

    // Validate overnight logic and normalize dayOfWeek
    const validatedHours = hoursArray.map((hour) => {
      const dayNum = normalizeDayOfWeek(hour.dayOfWeek);

      const [openH, openM] = hour.openTime.split(":").map(Number);
      const [closeH, closeM] = hour.closeTime.split(":").map(Number);
      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;

      // If business is not closed and close time is <= open time, closesNextDay MUST be true
      if (!hour.isClosed && closeMinutes <= openMinutes) {
        if (!hour.closesNextDay) {
          throw new ValidationError(
            `Operating hours ending at or before open time (${hour.openTime} -> ${hour.closeTime}) must have closesNextDay set to true.`
          );
        }
      }

      return {
        dayOfWeek: dayNum,
        openTime: hour.openTime,
        closeTime: hour.closeTime,
        closesNextDay: hour.closesNextDay ?? false,
        isClosed: hour.isClosed ?? false,
      };
    });

    return prisma.$transaction(async (tx) => {
      for (const item of validatedHours) {
        await tx.branchHours.upsert({
          where: {
            branchId_dayOfWeek: {
              branchId,
              dayOfWeek: item.dayOfWeek,
            },
          },
          update: {
            openTime: item.openTime,
            closeTime: item.closeTime,
            closesNextDay: item.closesNextDay,
            isClosed: item.isClosed,
          },
          create: {
            branchId,
            dayOfWeek: item.dayOfWeek,
            openTime: item.openTime,
            closeTime: item.closeTime,
            closesNextDay: item.closesNextDay,
            isClosed: item.isClosed,
          },
        });
      }

      const allHours = await tx.branchHours.findMany({
        where: { branchId },
        orderBy: { dayOfWeek: "asc" },
      });

      return allHours.map((h) => ({
        ...h,
        dayName: getDayName(h.dayOfWeek),
      }));
    });
  }

  /**
   * Helper to check if a specific date and time slot belongs to a branch operating window,
   * accounting for overnight business hours that span past midnight into the next morning.
   */
  static async getOperatingSessionForSlot(
    branchId: string,
    slotDate: Date,
    slotTime: string
  ): Promise<{
    isOpen: boolean;
    businessDayOfWeek: number;
    businessDayName: string;
    isOvernightWindow: boolean;
  }> {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { branchHours: true },
    });

    if (!branch || !branch.isActive) {
      return {
        isOpen: false,
        businessDayOfWeek: -1,
        businessDayName: "CLOSED",
        isOvernightWindow: false,
      };
    }

    const currentDayOfWeek = slotDate.getDay(); // 0 = Sun..6 = Sat
    const prevDayOfWeek = (currentDayOfWeek + 6) % 7; // e.g. Saturday (6) -> Friday (5)

    const [slotH, slotM] = slotTime.split(":").map(Number);
    const slotMinutes = slotH * 60 + slotM;

    // 1. Check if previous day had overnight hours (closesNextDay: true) that extend into this morning
    const prevDayHours = branch.branchHours.find((bh) => bh.dayOfWeek === prevDayOfWeek);
    if (prevDayHours && !prevDayHours.isClosed && prevDayHours.closesNextDay) {
      const [closeH, closeM] = prevDayHours.closeTime.split(":").map(Number);
      const closeMinutes = closeH * 60 + closeM;
      if (slotMinutes < closeMinutes) {
        return {
          isOpen: true,
          businessDayOfWeek: prevDayOfWeek,
          businessDayName: getDayName(prevDayOfWeek),
          isOvernightWindow: true,
        };
      }
    }

    // 2. Check current day's standard hours
    const currentDayHours = branch.branchHours.find((bh) => bh.dayOfWeek === currentDayOfWeek);
    if (!currentDayHours || currentDayHours.isClosed) {
      return {
        isOpen: false,
        businessDayOfWeek: currentDayOfWeek,
        businessDayName: getDayName(currentDayOfWeek),
        isOvernightWindow: false,
      };
    }

    const [openH, openM] = currentDayHours.openTime.split(":").map(Number);
    const [closeH, closeM] = currentDayHours.closeTime.split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = currentDayHours.closesNextDay
      ? (closeH + 24) * 60 + closeM
      : closeH * 60 + closeM;

    if (slotMinutes >= openMinutes && slotMinutes < closeMinutes) {
      return {
        isOpen: true,
        businessDayOfWeek: currentDayOfWeek,
        businessDayName: getDayName(currentDayOfWeek),
        isOvernightWindow: false,
      };
    }

    return {
      isOpen: false,
      businessDayOfWeek: currentDayOfWeek,
      businessDayName: getDayName(currentDayOfWeek),
      isOvernightWindow: false,
    };
  }
}
