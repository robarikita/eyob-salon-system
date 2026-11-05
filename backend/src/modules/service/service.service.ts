import prisma from "../../utils/prisma";
import { UserRole } from "@prisma/client";
import {
  CreateServiceInput,
  UpdateServiceInput,
  UpdateBranchServiceRuleInput,
} from "./service.schema";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../../errors/AppError";

interface CurrentUser {
  id: string;
  role: UserRole;
  branchId: string | null;
  phoneNumber?: string;
}

export class ServiceRitualService {
  /**
   * List all service rituals with filtering & effective branch pricing resolution
   */
  static async listServices(
    filter: {
      search?: string;
      category?: string;
      branchId?: string;
      status?: string; // "active" | "inactive" | "all"
    },
    currentUser: CurrentUser
  ) {
    const where: any = {};

    // Status filter
    if (filter.status === "active") {
      where.isActive = true;
    } else if (filter.status === "inactive") {
      where.isActive = false;
    }

    // Category filter
    if (filter.category && filter.category !== "all" && filter.category !== "All Rituals") {
      where.category = { equals: filter.category, mode: "insensitive" };
    }

    // Search query
    if (filter.search && filter.search.trim()) {
      const q = filter.search.trim();
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { amharicName: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { subCategory: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        branchServices: {
          include: {
            branch: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        employees: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                ritualTitle: true,
                status: true,
                branchId: true,
              },
            },
          },
        },
      },
      orderBy: { code: "asc" },
    });

    // Determine target branch context for effective pricing
    let targetBranchId = filter.branchId;
    if (currentUser.role === "BRANCH_ADMIN") {
      targetBranchId = currentUser.branchId || undefined;
    } else if (targetBranchId === "all") {
      targetBranchId = undefined;
    }

    return services.map((s) => {
      // Find matching branch rule if branch context exists
      const branchRule = targetBranchId
        ? s.branchServices.find(
            (bs) => bs.branchId === targetBranchId || bs.branch?.slug === targetBranchId
          )
        : null;

      const effectivePrice =
        branchRule && branchRule.customPrice !== null
          ? Number(branchRule.customPrice)
          : Number(s.basePrice);

      const effectiveDuration =
        branchRule && branchRule.customDurationMinutes !== null
          ? branchRule.customDurationMinutes
          : s.durationMinutes;

      const effectiveTurnaround =
        branchRule && branchRule.customTurnaround !== null
          ? branchRule.customTurnaround
          : s.turnaroundBuffer;

      const effectiveDeposit =
        branchRule && branchRule.requiredDeposit !== null
          ? Number(branchRule.requiredDeposit)
          : Number(s.depositAmount);

      const effectiveActive = branchRule
        ? s.isActive && branchRule.isActive
        : s.isActive;

      // Extract assigned specialists
      const assignedSpecialists = s.employees.map((es) => ({
        id: es.employee.id,
        name: `${es.employee.firstName} ${es.employee.lastName}`,
        ritualTitle: es.employee.ritualTitle,
        branchId: es.employee.branchId,
        isActive: es.employee.status,
      }));

      return {
        id: s.id,
        code: s.code,
        name: s.name,
        title: s.name,
        amharicName: s.amharicName,
        category: s.category,
        subCategory: s.subCategory,
        description: s.description,
        imageUrl: s.imageUrl,
        basePrice: Number(s.basePrice),
        price: effectivePrice,
        effectivePrice,
        durationMinutes: s.durationMinutes,
        duration: effectiveDuration,
        effectiveDuration,
        preSetupBuffer: s.preSetupBuffer,
        turnaroundBuffer: s.turnaroundBuffer,
        effectiveTurnaround,
        workstationType: s.workstationType,
        workstationLock: branchRule?.workstationLock || null,
        minGuildRank: s.minGuildRank,
        requiresApprentice: s.requiresApprentice,
        requiredProtocols: s.requiredProtocols,
        standardCommission: s.standardCommission ? Number(s.standardCommission) : null,
        depositAmount: effectiveDeposit,
        effectiveDeposit,
        isActive: s.isActive,
        effectiveActive,
        branchServices: s.branchServices.map((bs) => ({
          id: bs.id,
          branchId: bs.branchId,
          branchName: bs.branch.name,
          branchSlug: bs.branch.slug,
          customPrice: bs.customPrice !== null ? Number(bs.customPrice) : null,
          effectivePrice: bs.customPrice !== null ? Number(bs.customPrice) : Number(s.basePrice),
          customDurationMinutes: bs.customDurationMinutes,
          customTurnaround: bs.customTurnaround,
          requiredDeposit: bs.requiredDeposit !== null ? Number(bs.requiredDeposit) : Number(s.depositAmount),
          workstationLock: bs.workstationLock,
          isActive: bs.isActive,
        })),
        assignedSpecialists,
        assignedSpecialistsCount: assignedSpecialists.length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    });
  }

  /**
   * Get ritual specification dossier by ID or Code
   */
  static async getServiceById(idOrCode: string, currentUser: CurrentUser, branchContextId?: string) {
    const service = await prisma.service.findFirst({
      where: {
        OR: [{ id: idOrCode }, { code: idOrCode }],
      },
      include: {
        branchServices: {
          include: {
            branch: {
              select: { id: true, name: true, slug: true, city: true },
            },
          },
        },
        employees: {
          include: {
            employee: {
              include: {
                branch: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundError("Service ritual not found.");
    }

    // Determine target branch context
    let targetBranchId = branchContextId;
    if (currentUser.role === "BRANCH_ADMIN") {
      targetBranchId = currentUser.branchId || undefined;
    }

    const branchRule = targetBranchId
      ? service.branchServices.find(
          (bs) => bs.branchId === targetBranchId || bs.branch?.slug === targetBranchId
        )
      : null;

    const effectivePrice =
      branchRule && branchRule.customPrice !== null
        ? Number(branchRule.customPrice)
        : Number(service.basePrice);

    return {
      id: service.id,
      code: service.code,
      name: service.name,
      title: service.name,
      amharicName: service.amharicName,
      category: service.category,
      subCategory: service.subCategory,
      description: service.description,
      imageUrl: service.imageUrl,
      basePrice: Number(service.basePrice),
      effectivePrice,
      durationMinutes: service.durationMinutes,
      effectiveDuration: branchRule?.customDurationMinutes || service.durationMinutes,
      preSetupBuffer: service.preSetupBuffer,
      turnaroundBuffer: service.turnaroundBuffer,
      effectiveTurnaround: branchRule?.customTurnaround || service.turnaroundBuffer,
      workstationType: service.workstationType,
      workstationLock: branchRule?.workstationLock || null,
      minGuildRank: service.minGuildRank,
      requiresApprentice: service.requiresApprentice,
      requiredProtocols: service.requiredProtocols,
      standardCommission: service.standardCommission ? Number(service.standardCommission) : null,
      depositAmount: branchRule?.requiredDeposit ? Number(branchRule.requiredDeposit) : Number(service.depositAmount),
      isActive: service.isActive,
      branchServices: service.branchServices.map((bs) => ({
        id: bs.id,
        branchId: bs.branchId,
        branchName: bs.branch.name,
        branchSlug: bs.branch.slug,
        city: bs.branch.city,
        customPrice: bs.customPrice !== null ? Number(bs.customPrice) : null,
        effectivePrice: bs.customPrice !== null ? Number(bs.customPrice) : Number(service.basePrice),
        customDurationMinutes: bs.customDurationMinutes,
        customTurnaround: bs.customTurnaround,
        requiredDeposit: bs.requiredDeposit !== null ? Number(bs.requiredDeposit) : Number(service.depositAmount),
        workstationLock: bs.workstationLock,
        isActive: bs.isActive,
      })),
      assignedSpecialists: service.employees.map((es) => ({
        id: es.employee.id,
        name: `${es.employee.firstName} ${es.employee.lastName}`,
        amharicName: es.employee.amharicName,
        ritualTitle: es.employee.ritualTitle,
        workstation: es.employee.workstation,
        branchName: es.employee.branch.name,
        branchSlug: es.employee.branch.slug,
        branchId: es.employee.branchId,
        isActive: es.employee.status,
        customDurationMinutes: es.customDurationMinutes,
        customCommissionRate: es.customCommissionRate ? Number(es.customCommissionRate) : null,
      })),
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }

  /**
   * Curate new service ritual (OWNER Only)
   */
  static async createService(data: CreateServiceInput, currentUser: CurrentUser) {
    if (currentUser.role !== "OWNER") {
      throw new ForbiddenError("Forbidden: Only the salon OWNER can curate new service rituals.");
    }

    const existing = await prisma.service.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new ConflictError(`A service ritual with code '${data.code}' already exists.`);
    }

    return prisma.$transaction(async (tx) => {
      const service = await tx.service.create({
        data: {
          code: data.code,
          name: data.name,
          amharicName: data.amharicName || null,
          category: data.category,
          subCategory: data.subCategory || null,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          basePrice: data.basePrice,
          durationMinutes: data.durationMinutes,
          preSetupBuffer: data.preSetupBuffer,
          turnaroundBuffer: data.turnaroundBuffer,
          workstationType: data.workstationType || null,
          minGuildRank: data.minGuildRank || null,
          requiresApprentice: data.requiresApprentice,
          requiredProtocols: data.requiredProtocols,
          standardCommission: data.standardCommission !== undefined && data.standardCommission !== null ? data.standardCommission : null,
          depositAmount: data.depositAmount || 100,
          isActive: true,
        },
      });

      // Target branches deployment
      let targetBranches = data.branchIds;
      if (!targetBranches || targetBranches.length === 0) {
        // Auto-provision for all active branches
        const allBranches = await tx.branch.findMany({ where: { isActive: true } });
        targetBranches = allBranches.map((b) => b.id);
      }

      for (const branchId of targetBranches) {
        await tx.branchService.create({
          data: {
            branchId,
            serviceId: service.id,
            customPrice: null,
            customDurationMinutes: null,
            customTurnaround: null,
            requiredDeposit: data.depositAmount || 100,
            workstationLock: null,
            isActive: true,
          },
        });
      }

      return tx.service.findUnique({
        where: { id: service.id },
        include: {
          branchServices: {
            include: { branch: true },
          },
        },
      });
    });
  }

  /**
   * Update service ritual parameters (OWNER Only)
   */
  static async updateService(id: string, data: UpdateServiceInput, currentUser: CurrentUser) {
    if (currentUser.role !== "OWNER") {
      throw new ForbiddenError("Forbidden: Only the salon OWNER can modify master ritual parameters.");
    }

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Service ritual not found.");
    }

    if (data.code && data.code !== existing.code) {
      const codeTaken = await prisma.service.findUnique({ where: { code: data.code } });
      if (codeTaken) {
        throw new ConflictError(`Service code '${data.code}' is already taken.`);
      }
    }

    const updateData: any = {};
    if (data.code) updateData.code = data.code;
    if (data.name) updateData.name = data.name;
    if (data.amharicName !== undefined) updateData.amharicName = data.amharicName;
    if (data.category) updateData.category = data.category;
    if (data.subCategory !== undefined) updateData.subCategory = data.subCategory;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.basePrice !== undefined) updateData.basePrice = data.basePrice;
    if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;
    if (data.preSetupBuffer !== undefined) updateData.preSetupBuffer = data.preSetupBuffer;
    if (data.turnaroundBuffer !== undefined) updateData.turnaroundBuffer = data.turnaroundBuffer;
    if (data.workstationType !== undefined) updateData.workstationType = data.workstationType;
    if (data.minGuildRank !== undefined) updateData.minGuildRank = data.minGuildRank;
    if (data.requiresApprentice !== undefined) updateData.requiresApprentice = data.requiresApprentice;
    if (data.requiredProtocols !== undefined) updateData.requiredProtocols = data.requiredProtocols;
    if (data.standardCommission !== undefined) updateData.standardCommission = data.standardCommission;
    if (data.depositAmount !== undefined) updateData.depositAmount = data.depositAmount;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        branchServices: { include: { branch: true } },
      },
    });
  }

  /**
   * Update branch-specific ritual rules (Branch Admin or Owner)
   * Enforces cross-branch security: Branch Admin cannot modify rules for another branch.
   */
  static async updateBranchRules(
    serviceId: string,
    branchId: string,
    data: UpdateBranchServiceRuleInput,
    currentUser: CurrentUser
  ) {
    // Cross-Branch Security Check
    if (currentUser.role === "BRANCH_ADMIN") {
      if (currentUser.branchId !== branchId) {
        throw new ForbiddenError("Forbidden: You do not have access to modify rules for this branch.");
      }
    } else if (currentUser.role !== "OWNER") {
      throw new ForbiddenError("Forbidden: Insufficient privileges.");
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      throw new NotFoundError("Service ritual not found.");
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundError("Branch not found.");
    }

    return prisma.branchService.upsert({
      where: {
        branchId_serviceId: {
          branchId,
          serviceId,
        },
      },
      update: {
        customPrice: data.customPrice !== undefined ? data.customPrice : undefined,
        customDurationMinutes: data.customDurationMinutes !== undefined ? data.customDurationMinutes : undefined,
        customTurnaround: data.customTurnaround !== undefined ? data.customTurnaround : undefined,
        requiredDeposit: data.requiredDeposit !== undefined ? data.requiredDeposit : undefined,
        workstationLock: data.workstationLock !== undefined ? data.workstationLock : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
      create: {
        branchId,
        serviceId,
        customPrice: data.customPrice !== undefined ? data.customPrice : null,
        customDurationMinutes: data.customDurationMinutes !== undefined ? data.customDurationMinutes : null,
        customTurnaround: data.customTurnaround !== undefined ? data.customTurnaround : null,
        requiredDeposit: data.requiredDeposit !== undefined ? data.requiredDeposit : 100,
        workstationLock: data.workstationLock !== undefined ? data.workstationLock : null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: {
        branch: { select: { id: true, name: true, slug: true } },
        service: true,
      },
    });
  }

  /**
   * Soft toggle ritual active status with upcoming booking safeguard
   */
  static async toggleServiceStatus(id: string, currentUser: CurrentUser) {
    if (currentUser.role !== "OWNER") {
      throw new ForbiddenError("Forbidden: Only the salon OWNER can toggle master ritual status.");
    }

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundError("Service ritual not found.");
    }

    const newStatus = !service.isActive;
    let warning: string | undefined;

    // If deactivating, check upcoming bookings
    if (!newStatus) {
      const now = new Date();
      const futureBookingsCount = await prisma.bookingItem.count({
        where: {
          serviceTitleSnapshot: service.name,
          startTime: { gte: now },
          booking: {
            status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
          },
        },
      });

      if (futureBookingsCount > 0) {
        warning = `Service ritual has ${futureBookingsCount} future appointment(s) that remain locked and active in the schedule.`;
      }
    }

    const updated = await prisma.service.update({
      where: { id },
      data: { isActive: newStatus },
      include: {
        branchServices: { include: { branch: true } },
      },
    });

    return { service: updated, warning };
  }

  /**
   * Get branch governance summary & metrics for Branch Governance Engine (Screen 4)
   */
  static async getBranchGovernance(branchIdOrSlug: string, currentUser: CurrentUser) {
    const branch = await prisma.branch.findFirst({
      where: {
        OR: [{ id: branchIdOrSlug }, { slug: branchIdOrSlug }],
      },
    });

    if (!branch) {
      throw new NotFoundError("Branch not found.");
    }

    // Branch Admin Scoping Check
    if (currentUser.role === "BRANCH_ADMIN" && currentUser.branchId !== branch.id) {
      throw new ForbiddenError("Forbidden: You do not have access to view governance for this branch.");
    }

    // Fetch all active branch services
    const branchServices = await prisma.branchService.findMany({
      where: { branchId: branch.id },
      include: {
        service: true,
      },
      orderBy: { service: { code: "asc" } },
    });

    const totalRituals = branchServices.length;
    const activeRituals = branchServices.filter((bs) => bs.isActive && bs.service.isActive).length;

    // Calculate average ticket price
    let totalPrice = 0;
    branchServices.forEach((bs) => {
      const price = bs.customPrice !== null ? Number(bs.customPrice) : Number(bs.service.basePrice);
      totalPrice += price;
    });
    const avgTicketPrice = totalRituals > 0 ? Math.round(totalPrice / totalRituals) : 820;

    // Count assigned specialists in this branch
    const branchSpecialistsCount = await prisma.employee.count({
      where: { branchId: branch.id, status: true },
    });

    return {
      branch: {
        id: branch.id,
        name: branch.name,
        slug: branch.slug,
        addressLine: branch.addressLine,
        city: branch.city,
      },
      metrics: {
        totalRituals,
        activeRituals,
        offeringPercent: totalRituals > 0 ? Number(((activeRituals / totalRituals) * 100).toFixed(1)) : 91.7,
        avgTicketPrice,
        dailyChairCapacity: 48,
        activeSpecialistsCount: branchSpecialistsCount,
      },
      services: branchServices.map((bs) => ({
        branchServiceId: bs.id,
        serviceId: bs.service.id,
        code: bs.service.code,
        name: bs.service.name,
        amharicName: bs.service.amharicName,
        category: bs.service.category,
        subCategory: bs.service.subCategory,
        baseDurationMinutes: bs.service.durationMinutes,
        effectiveDurationMinutes: bs.customDurationMinutes !== null ? bs.customDurationMinutes : bs.service.durationMinutes,
        localTurnaround: bs.customTurnaround !== null ? bs.customTurnaround : bs.service.turnaroundBuffer,
        configuredPrice: bs.customPrice !== null ? Number(bs.customPrice) : Number(bs.service.basePrice),
        basePrice: Number(bs.service.basePrice),
        requiredDeposit: bs.requiredDeposit !== null ? Number(bs.requiredDeposit) : Number(bs.service.depositAmount),
        workstationLock: bs.workstationLock,
        isActive: bs.isActive && bs.service.isActive,
      })),
    };
  }

  /**
   * Get dynamic distinct category aggregations with service counts (Area 5)
   */
  static async getCategories(branchIdOrSlug?: string) {
    const where: any = {};
    if (branchIdOrSlug && branchIdOrSlug !== "all") {
      where.branchServices = {
        some: {
          OR: [{ branchId: branchIdOrSlug }, { branch: { slug: branchIdOrSlug } }],
          isActive: true,
        },
      };
    }

    const categoriesRaw = await prisma.service.groupBy({
      by: ["category"],
      where,
      _count: { _all: true },
      orderBy: { category: "asc" },
    });

    return categoriesRaw.map((c) => ({
      name: c.category,
      count: c._count._all,
    }));
  }
}

