import prisma from "../../utils/prisma";
import { UserRole } from "@prisma/client";
import { ValidationError, NotFoundError } from "../../errors/AppError";
import { z } from "zod";
import { createBranchSchema, updateBranchSchema, setBranchHoursSchema } from "./branch.schema";

type CreateBranchInput = z.infer<typeof createBranchSchema>;
type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
type SetBranchHoursInput = z.infer<typeof setBranchHoursSchema>;

export class BranchService {
  static async createBranch(data: CreateBranchInput) {
    const existingBranch = await prisma.branch.findUnique({
      where: { slug: data.slug },
    });

    if (existingBranch) {
      throw new ValidationError("Branch slug must be unique");
    }

    return prisma.$transaction(async (tx) => {
      const branch = await tx.branch.create({
        data: {
          name: data.name,
          slug: data.slug,
          phoneNumber: data.phoneNumber,
          addressLine: data.addressLine,
          city: data.city,
          slotBufferMinutes: data.slotBufferMinutes,
        },
      });

      // Default 7-day operating hours
      const defaultHours = Array.from({ length: 7 }, (_, i) => ({
        branchId: branch.id,
        dayOfWeek: i,
        openTime: "09:00",
        closeTime: "20:00",
        isClosed: false,
      }));

      await tx.branchHours.createMany({
        data: defaultHours,
      });

      return branch;
    });
  }

  static async getAllBranches(userRole?: UserRole) {
    if (userRole === "OWNER") {
      return prisma.branch.findMany({
        include: {
          _count: {
            select: { employees: true, services: true },
          },
        },
      });
    }

    // Public / CUSTOMER / EMPLOYEE view
    return prisma.branch.findMany({
      where: { isActive: true },
    });
  }

  static async getBranchById(id: string) {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        branchHours: {
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    if (!branch) {
      throw new NotFoundError("Branch not found");
    }

    return branch;
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

    return prisma.branch.update({
      where: { id },
      data,
    });
  }

  static async setBranchHours(branchId: string, hours: SetBranchHoursInput) {
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundError("Branch not found");

    return prisma.$transaction(async (tx) => {
      for (const hour of hours) {
        await tx.branchHours.upsert({
          where: {
            branchId_dayOfWeek: {
              branchId,
              dayOfWeek: hour.dayOfWeek,
            },
          },
          update: {
            openTime: hour.openTime,
            closeTime: hour.closeTime,
            isClosed: hour.isClosed,
          },
          create: {
            branchId,
            dayOfWeek: hour.dayOfWeek,
            openTime: hour.openTime,
            closeTime: hour.closeTime,
            isClosed: hour.isClosed,
          },
        });
      }

      return tx.branchHours.findMany({
        where: { branchId },
        orderBy: { dayOfWeek: "asc" },
      });
    });
  }

  static async toggleBranchStatus(id: string) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundError("Branch not found");

    return prisma.branch.update({
      where: { id },
      data: { isActive: !branch.isActive },
    });
  }
}
