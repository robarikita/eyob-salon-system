import prisma from "../../utils/prisma";
import { UserRole, DepositType } from "@prisma/client";
import {
  CreateServiceInput,
  UpdateServiceInput,
  BranchPriceOverrideInput,
  DepositRuleInput,
  UpdateBranchServiceRuleInput,
} from "./service.schema";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../../errors/AppError";
import { uploadImage } from "../../utils/cloudinary";

interface CurrentUser {
  id: string;
  role: UserRole;
  branchId: string | null;
  phoneNumber?: string;
}

export class ServiceRitualService {
  /**
   * Calculate required deposit for a service at a specific branch using the 3-tier hierarchy:
   * Priority 1: Service branch override (BranchServicePrice.depositType & depositValue)
   * Priority 2: Service global rule (Service.depositType & depositValue)
   * Priority 3: Branch default rule (Branch.defaultDepositType & defaultDepositValue)
   */
  static async getDepositCalculation(
    serviceId: string,
    branchId: string,
    effectivePrice?: number
  ): Promise<{
    depositAmount: number;
    appliedRule: "BRANCH_OVERRIDE" | "SERVICE_GLOBAL" | "BRANCH_DEFAULT";
    depositType: DepositType;
    depositValue: number;
  }> {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        branchPrices: { where: { branchId } },
      },
    });

    if (!service) {
      throw new NotFoundError("Service ritual not found.");
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      throw new NotFoundError("Branch not found.");
    }

    const branchOverride = service.branchPrices[0];
    const price =
      effectivePrice !== undefined
        ? effectivePrice
        : branchOverride && branchOverride.customPrice !== null
        ? Number(branchOverride.customPrice)
        : Number(service.basePrice);

    // Priority 1: Service branch override
    if (branchOverride && branchOverride.depositType) {
      const dType = branchOverride.depositType;
      const dVal = Number(branchOverride.depositValue ?? 0);
      let calculated = 0;
      if (dType === "NONE") calculated = 0;
      else if (dType === "FIXED") calculated = dVal;
      else if (dType === "PERCENTAGE") calculated = (price * dVal) / 100;

      return {
        depositAmount: Math.round(calculated * 100) / 100,
        appliedRule: "BRANCH_OVERRIDE",
        depositType: dType,
        depositValue: dVal,
      };
    }

    // Priority 2: Service global rule (if not default NONE)
    if (service.depositType && service.depositType !== "NONE") {
      const dType = service.depositType;
      const dVal = Number(service.depositValue ?? service.depositAmount ?? 0);
      let calculated = 0;
      if (dType === "FIXED") calculated = dVal;
      else if (dType === "PERCENTAGE") calculated = (price * dVal) / 100;

      return {
        depositAmount: Math.round(calculated * 100) / 100,
        appliedRule: "SERVICE_GLOBAL",
        depositType: dType,
        depositValue: dVal,
      };
    }

    // Priority 3: Branch default rule
    const bType = branch.defaultDepositType || "PERCENTAGE";
    const bVal = Number(branch.defaultDepositValue ?? 20);
    let calculated = 0;
    if (bType === "NONE") calculated = 0;
    else if (bType === "FIXED") calculated = bVal;
    else if (bType === "PERCENTAGE") calculated = (price * bVal) / 100;

    return {
      depositAmount: Math.round(calculated * 100) / 100,
      appliedRule: "BRANCH_DEFAULT",
      depositType: bType,
      depositValue: bVal,
    };
  }

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
    currentUser?: CurrentUser
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
        { nameAm: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { subCategory: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        branchPrices: {
          include: {
            branch: { select: { id: true, name: true, slug: true } },
          },
        },
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
    if (currentUser?.role === "BRANCH_ADMIN") {
      targetBranchId = currentUser.branchId || undefined;
    } else if (targetBranchId === "all") {
      targetBranchId = undefined;
    }

    // Fetch branch defaults if branch context is present
    let targetBranch: { defaultDepositType: DepositType; defaultDepositValue: any } | null = null;
    if (targetBranchId) {
      targetBranch = await prisma.branch.findFirst({
        where: { OR: [{ id: targetBranchId }, { slug: targetBranchId }] },
        select: { defaultDepositType: true, defaultDepositValue: true },
      });
    }

    return services.map((s) => {
      // Find matching branch override
      const branchPrice = targetBranchId
        ? s.branchPrices.find((bp) => bp.branchId === targetBranchId || bp.branch?.slug === targetBranchId)
        : null;

      const branchRule = targetBranchId
        ? s.branchServices.find((bs) => bs.branchId === targetBranchId || bs.branch?.slug === targetBranchId)
        : null;

      const effectivePrice =
        branchPrice && branchPrice.customPrice !== null
          ? Number(branchPrice.customPrice)
          : branchRule && branchRule.customPrice !== null
          ? Number(branchRule.customPrice)
          : Number(s.basePrice);

      const effectiveDuration =
        branchPrice && branchPrice.customDurationMinutes !== null
          ? branchPrice.customDurationMinutes
          : branchRule && branchRule.customDurationMinutes !== null
          ? branchRule.customDurationMinutes
          : s.durationMinutes;

      const effectiveTurnaround =
        branchRule && branchRule.customTurnaround !== null
          ? branchRule.customTurnaround
          : s.turnaroundBuffer;

      // Calculate effective deposit
      let effectiveDeposit = Number(s.depositAmount || 0);
      let effectiveDepositType: DepositType = s.depositType;
      let effectiveDepositValue = Number(s.depositValue || 0);

      if (branchPrice && branchPrice.depositType) {
        effectiveDepositType = branchPrice.depositType;
        effectiveDepositValue = Number(branchPrice.depositValue ?? 0);
        if (effectiveDepositType === "NONE") effectiveDeposit = 0;
        else if (effectiveDepositType === "FIXED") effectiveDeposit = effectiveDepositValue;
        else if (effectiveDepositType === "PERCENTAGE") effectiveDeposit = (effectivePrice * effectiveDepositValue) / 100;
      } else if (s.depositType && s.depositType !== "NONE") {
        effectiveDepositType = s.depositType;
        effectiveDepositValue = Number(s.depositValue || 0);
        if (effectiveDepositType === "FIXED") effectiveDeposit = effectiveDepositValue;
        else if (effectiveDepositType === "PERCENTAGE") effectiveDeposit = (effectivePrice * effectiveDepositValue) / 100;
      } else if (targetBranch) {
        effectiveDepositType = targetBranch.defaultDepositType;
        effectiveDepositValue = Number(targetBranch.defaultDepositValue);
        if (effectiveDepositType === "NONE") effectiveDeposit = 0;
        else if (effectiveDepositType === "FIXED") effectiveDeposit = effectiveDepositValue;
        else if (effectiveDepositType === "PERCENTAGE") effectiveDeposit = (effectivePrice * effectiveDepositValue) / 100;
      }

      effectiveDeposit = Math.round(effectiveDeposit * 100) / 100;

      const effectiveActive = branchPrice
        ? s.isActive && branchPrice.isActive
        : branchRule
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
        nameAm: s.nameAm || s.amharicName,
        amharicName: s.nameAm || s.amharicName,
        slug: s.slug,
        category: s.category,
        subCategory: s.subCategory,
        description: s.description,
        descriptionAm: s.descriptionAm,
        imageUrl: s.imageUrl,
        cloudinaryPublicId: s.cloudinaryPublicId,
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
        depositType: s.depositType,
        depositValue: Number(s.depositValue),
        depositAmount: effectiveDeposit,
        effectiveDeposit,
        isActive: s.isActive,
        effectiveActive,
        branchPrices: s.branchPrices.map((bp) => ({
          id: bp.id,
          branchId: bp.branchId,
          branchName: bp.branch?.name,
          branchSlug: bp.branch?.slug,
          customPrice: Number(bp.customPrice),
          customDurationMinutes: bp.customDurationMinutes,
          depositType: bp.depositType,
          depositValue: bp.depositValue !== null ? Number(bp.depositValue) : null,
          isActive: bp.isActive,
        })),
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
   * Get ritual specification dossier by ID, Slug, or Code
   */
  static async getServiceById(idOrCode: string, currentUser?: CurrentUser, branchContextId?: string) {
    const service = await prisma.service.findFirst({
      where: {
        OR: [{ id: idOrCode }, { code: idOrCode }, { slug: idOrCode }],
      },
      include: {
        branchPrices: {
          include: {
            branch: { select: { id: true, name: true, slug: true, city: true } },
          },
        },
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
                branch: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundError("Service ritual not found.");
    }

    let targetBranchId = branchContextId;
    if (currentUser?.role === "BRANCH_ADMIN") {
      targetBranchId = currentUser.branchId || undefined;
    }

    const branchPrice = targetBranchId
      ? service.branchPrices.find((bp) => bp.branchId === targetBranchId || bp.branch?.slug === targetBranchId)
      : null;

    const branchRule = targetBranchId
      ? service.branchServices.find((bs) => bs.branchId === targetBranchId || bs.branch?.slug === targetBranchId)
      : null;

    const effectivePrice =
      branchPrice && branchPrice.customPrice !== null
        ? Number(branchPrice.customPrice)
        : branchRule && branchRule.customPrice !== null
        ? Number(branchRule.customPrice)
        : Number(service.basePrice);

    const effectiveDuration =
      branchPrice && branchPrice.customDurationMinutes !== null
        ? branchPrice.customDurationMinutes
        : branchRule && branchRule.customDurationMinutes !== null
        ? branchRule.customDurationMinutes
        : service.durationMinutes;

    let targetBranch: { defaultDepositType: DepositType; defaultDepositValue: any } | null = null;
    if (targetBranchId) {
      targetBranch = await prisma.branch.findFirst({
        where: { OR: [{ id: targetBranchId }, { slug: targetBranchId }] },
        select: { defaultDepositType: true, defaultDepositValue: true },
      });
    }

    let effectiveDeposit = Number(service.depositAmount || 0);
    if (branchPrice && branchPrice.depositType) {
      const dType = branchPrice.depositType;
      const dVal = Number(branchPrice.depositValue ?? 0);
      if (dType === "NONE") effectiveDeposit = 0;
      else if (dType === "FIXED") effectiveDeposit = dVal;
      else if (dType === "PERCENTAGE") effectiveDeposit = (effectivePrice * dVal) / 100;
    } else if (service.depositType && service.depositType !== "NONE") {
      const dType = service.depositType;
      const dVal = Number(service.depositValue || 0);
      if (dType === "FIXED") effectiveDeposit = dVal;
      else if (dType === "PERCENTAGE") effectiveDeposit = (effectivePrice * dVal) / 100;
    } else if (targetBranch) {
      const dType = targetBranch.defaultDepositType;
      const dVal = Number(targetBranch.defaultDepositValue);
      if (dType === "NONE") effectiveDeposit = 0;
      else if (dType === "FIXED") effectiveDeposit = dVal;
      else if (dType === "PERCENTAGE") effectiveDeposit = (effectivePrice * dVal) / 100;
    }

    effectiveDeposit = Math.round(effectiveDeposit * 100) / 100;

    return {
      id: service.id,
      code: service.code,
      name: service.name,
      title: service.name,
      nameAm: service.nameAm || service.amharicName,
      amharicName: service.nameAm || service.amharicName,
      slug: service.slug,
      category: service.category,
      subCategory: service.subCategory,
      description: service.description,
      descriptionAm: service.descriptionAm,
      imageUrl: service.imageUrl,
      cloudinaryPublicId: service.cloudinaryPublicId,
      basePrice: Number(service.basePrice),
      price: effectivePrice,
      effectivePrice,
      durationMinutes: service.durationMinutes,
      duration: effectiveDuration,
      effectiveDuration,
      preSetupBuffer: service.preSetupBuffer,
      turnaroundBuffer: service.turnaroundBuffer,
      effectiveTurnaround: branchRule?.customTurnaround !== null ? branchRule?.customTurnaround : service.turnaroundBuffer,
      workstationType: service.workstationType,
      workstationLock: branchRule?.workstationLock || null,
      minGuildRank: service.minGuildRank,
      requiresApprentice: service.requiresApprentice,
      requiredProtocols: service.requiredProtocols,
      standardCommission: service.standardCommission ? Number(service.standardCommission) : null,
      depositType: service.depositType,
      depositValue: Number(service.depositValue),
      depositAmount: effectiveDeposit,
      effectiveDeposit,
      isActive: service.isActive,
      effectiveActive: branchPrice ? service.isActive && branchPrice.isActive : branchRule ? service.isActive && branchRule.isActive : service.isActive,
      branchPrices: service.branchPrices.map((bp) => ({
        id: bp.id,
        branchId: bp.branchId,
        branchName: bp.branch?.name,
        branchSlug: bp.branch?.slug,
        customPrice: Number(bp.customPrice),
        customDurationMinutes: bp.customDurationMinutes,
        depositType: bp.depositType,
        depositValue: bp.depositValue !== null ? Number(bp.depositValue) : null,
        isActive: bp.isActive,
      })),
      branchServices: service.branchServices.map((bs) => ({
        id: bs.id,
        branchId: bs.branchId,
        branchName: bs.branch.name,
        branchSlug: bs.branch.slug,
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
   * Curate new service ritual and record initial price history
   */
  static async createService(data: CreateServiceInput, currentUser: CurrentUser) {
    const code =
      data.code ||
      `SR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const existing = await prisma.service.findUnique({
      where: { code },
    });
    if (existing) {
      throw new ConflictError(`A service ritual with code '${code}' already exists.`);
    }

    const slug =
      data.slug ||
      `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;

    let finalImageUrl = data.imageUrl || null;
    let finalCloudinaryId = data.cloudinaryPublicId || null;

    if (finalImageUrl && finalImageUrl.startsWith("data:image")) {
      const uploadRes = await uploadImage(finalImageUrl);
      finalImageUrl = uploadRes.url;
      finalCloudinaryId = uploadRes.publicId || null;
    }

    const depositVal = data.depositValue !== undefined ? data.depositValue : data.depositAmount || 0;

    return prisma.$transaction(async (tx) => {
      const service = await tx.service.create({
        data: {
          code,
          name: data.name,
          nameAm: data.nameAm || data.amharicName || null,
          amharicName: data.nameAm || data.amharicName || null,
          slug,
          category: data.category,
          subCategory: data.subCategory || null,
          description: data.description || null,
          descriptionAm: data.descriptionAm || null,
          imageUrl: finalImageUrl,
          cloudinaryPublicId: finalCloudinaryId,
          basePrice: data.basePrice,
          durationMinutes: data.durationMinutes,
          depositType: (data.depositType as DepositType) || "NONE",
          depositValue: depositVal,
          depositAmount: depositVal,
          preSetupBuffer: data.preSetupBuffer || 0,
          turnaroundBuffer: data.turnaroundBuffer || 15,
          workstationType: data.workstationType || null,
          minGuildRank: data.minGuildRank || null,
          requiresApprentice: data.requiresApprentice || false,
          requiredProtocols: data.requiredProtocols || [],
          standardCommission: data.standardCommission !== undefined ? data.standardCommission : null,
          isActive: true,
        },
      });

      // Insert initial ServicePriceHistory audit record
      await tx.servicePriceHistory.create({
        data: {
          serviceId: service.id,
          branchId: null,
          price: data.basePrice,
          changedBy: currentUser.id,
          reason: "Initial master service creation baseline",
        },
      });

      // Target branches deployment
      let targetBranches = data.branchIds;
      if (!targetBranches || targetBranches.length === 0) {
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
            requiredDeposit: depositVal,
            workstationLock: null,
            isActive: true,
          },
        });

        await tx.branchServicePrice.create({
          data: {
            branchId,
            serviceId: service.id,
            customPrice: data.basePrice,
            customDurationMinutes: data.durationMinutes,
            depositType: null,
            depositValue: null,
            isActive: true,
          },
        });
      }

      return tx.service.findUnique({
        where: { id: service.id },
        include: {
          branchPrices: { include: { branch: true } },
          branchServices: { include: { branch: true } },
          priceHistory: true,
        },
      });
    });
  }

  /**
   * Update service ritual parameters and record ServicePriceHistory on basePrice mutation
   */
  static async updateService(id: string, data: UpdateServiceInput, currentUser: CurrentUser) {
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

    let finalImageUrl = data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl;
    let finalCloudinaryId = data.cloudinaryPublicId !== undefined ? data.cloudinaryPublicId : existing.cloudinaryPublicId;

    if (finalImageUrl && finalImageUrl.startsWith("data:image")) {
      const uploadRes = await uploadImage(finalImageUrl);
      finalImageUrl = uploadRes.url;
      finalCloudinaryId = uploadRes.publicId || null;
    }

    const updateData: any = {};
    if (data.code) updateData.code = data.code;
    if (data.name) updateData.name = data.name;
    if (data.nameAm !== undefined || data.amharicName !== undefined) {
      updateData.nameAm = data.nameAm || data.amharicName;
      updateData.amharicName = data.nameAm || data.amharicName;
    }
    if (data.slug) updateData.slug = data.slug;
    if (data.category) updateData.category = data.category;
    if (data.subCategory !== undefined) updateData.subCategory = data.subCategory;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.descriptionAm !== undefined) updateData.descriptionAm = data.descriptionAm;
    if (finalImageUrl !== undefined) updateData.imageUrl = finalImageUrl;
    if (finalCloudinaryId !== undefined) updateData.cloudinaryPublicId = finalCloudinaryId;
    if (data.basePrice !== undefined) updateData.basePrice = data.basePrice;
    if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;
    if (data.depositType !== undefined) updateData.depositType = data.depositType;
    if (data.depositValue !== undefined) {
      updateData.depositValue = data.depositValue;
      updateData.depositAmount = data.depositValue;
    } else if (data.depositAmount !== undefined) {
      updateData.depositValue = data.depositAmount;
      updateData.depositAmount = data.depositAmount;
    }
    if (data.preSetupBuffer !== undefined) updateData.preSetupBuffer = data.preSetupBuffer;
    if (data.turnaroundBuffer !== undefined) updateData.turnaroundBuffer = data.turnaroundBuffer;
    if (data.workstationType !== undefined) updateData.workstationType = data.workstationType;
    if (data.minGuildRank !== undefined) updateData.minGuildRank = data.minGuildRank;
    if (data.requiresApprentice !== undefined) updateData.requiresApprentice = data.requiresApprentice;
    if (data.requiredProtocols !== undefined) updateData.requiredProtocols = data.requiredProtocols;
    if (data.standardCommission !== undefined) updateData.standardCommission = data.standardCommission;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.$transaction(async (tx) => {
      // Record historical price audit if basePrice changed
      if (data.basePrice !== undefined && Number(data.basePrice) !== Number(existing.basePrice)) {
        await tx.servicePriceHistory.create({
          data: {
            serviceId: id,
            branchId: null,
            price: data.basePrice,
            changedBy: currentUser.id,
            reason: data.priceChangeReason || "Master service price mutation",
          },
        });
      }

      return tx.service.update({
        where: { id },
        data: updateData,
        include: {
          branchPrices: { include: { branch: true } },
          branchServices: { include: { branch: true } },
          priceHistory: { orderBy: { effectiveFrom: "desc" } },
        },
      });
    });
  }

  /**
   * Set branch-specific price & duration override and insert into ServicePriceHistory
   */
  static async setBranchPrice(
    serviceId: string,
    data: BranchPriceOverrideInput,
    currentUser: CurrentUser
  ) {
    if (currentUser.role === "BRANCH_ADMIN") {
      if (currentUser.branchId !== data.branchId) {
        throw new ForbiddenError("Forbidden: You do not have access to modify rules for this branch.");
      }
    } else if (currentUser.role !== "OWNER") {
      throw new ForbiddenError("Forbidden: Insufficient privileges.");
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new NotFoundError("Service ritual not found.");

    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
    if (!branch) throw new NotFoundError("Branch not found.");

    return prisma.$transaction(async (tx) => {
      // 1. Upsert BranchServicePrice
      const branchPrice = await tx.branchServicePrice.upsert({
        where: {
          branchId_serviceId: {
            branchId: data.branchId,
            serviceId,
          },
        },
        update: {
          customPrice: data.customPrice,
          customDurationMinutes: data.customDurationMinutes ?? undefined,
          depositType: data.depositType !== undefined ? (data.depositType as DepositType) : undefined,
          depositValue: data.depositValue !== undefined && data.depositValue !== null ? data.depositValue : undefined,
          isActive: data.isActive !== undefined ? data.isActive : undefined,
        },
        create: {
          branchId: data.branchId,
          serviceId,
          customPrice: data.customPrice,
          customDurationMinutes: data.customDurationMinutes ?? null,
          depositType: (data.depositType as DepositType) || null,
          depositValue: data.depositValue !== undefined ? data.depositValue : null,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
        include: {
          branch: { select: { id: true, name: true, slug: true } },
          service: true,
        },
      });

      // 2. Also keep BranchService in sync
      await tx.branchService.upsert({
        where: {
          branchId_serviceId: {
            branchId: data.branchId,
            serviceId,
          },
        },
        update: {
          customPrice: data.customPrice,
          customDurationMinutes: data.customDurationMinutes ?? undefined,
          isActive: data.isActive !== undefined ? data.isActive : undefined,
        },
        create: {
          branchId: data.branchId,
          serviceId,
          customPrice: data.customPrice,
          customDurationMinutes: data.customDurationMinutes ?? null,
          requiredDeposit: 100,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      });

      // 3. Log to ServicePriceHistory
      await tx.servicePriceHistory.create({
        data: {
          serviceId,
          branchId: data.branchId,
          price: data.customPrice,
          changedBy: currentUser.id,
          reason: data.reason || `Branch price override for ${branch.name}`,
        },
      });

      return branchPrice;
    });
  }

  /**
   * Retrieve immutable ServicePriceHistory audit records
   */
  static async getPriceHistory(serviceId: string, branchId?: string) {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new NotFoundError("Service ritual not found.");

    const where: any = { serviceId };
    if (branchId) {
      where.branchId = branchId;
    }

    return prisma.servicePriceHistory.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { effectiveFrom: "desc" },
    });
  }

  /**
   * Set Branch Default Deposit Rule (Owner or Scoped Branch Admin)
   */
  static async setBranchDepositRule(
    branchId: string,
    data: DepositRuleInput,
    currentUser: CurrentUser
  ) {
    if (currentUser.role === "BRANCH_ADMIN") {
      if (currentUser.branchId !== branchId) {
        throw new ForbiddenError("Forbidden: branch access denied");
      }
    } else if (currentUser.role !== "OWNER") {
      throw new ForbiddenError("Forbidden: Insufficient privileges.");
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundError("Branch not found.");

    return prisma.branch.update({
      where: { id: branchId },
      data: {
        defaultDepositType: data.depositType as DepositType,
        defaultDepositValue: data.depositValue,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        defaultDepositType: true,
        defaultDepositValue: true,
      },
    });
  }

  /**
   * Soft toggle ritual active status with upcoming booking safeguard
   */
  static async toggleServiceStatus(id: string, _currentUser?: CurrentUser) {
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundError("Service ritual not found.");
    }

    const newStatus = !service.isActive;
    let warning: string | undefined;

    if (!newStatus) {
      const now = new Date();
      const futureBookingsCount = await prisma.bookingItem.count({
        where: {
          serviceId: service.id,
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
        branchPrices: { include: { branch: true } },
        branchServices: { include: { branch: true } },
      },
    });

    return {
      service: {
        ...updated,
        status: updated.isActive,
      },
      warning,
    };
  }

  /**
   * Update branch-specific ritual rules (Legacy compatibility)
   */
  static async updateBranchRules(
    serviceId: string,
    branchId: string,
    data: UpdateBranchServiceRuleInput,
    currentUser: CurrentUser
  ) {
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

    return prisma.$transaction(async (tx) => {
      const updated = await tx.branchService.upsert({
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

      if (data.customPrice !== undefined && data.customPrice !== null) {
        await tx.branchServicePrice.upsert({
          where: { branchId_serviceId: { branchId, serviceId } },
          update: {
            customPrice: data.customPrice,
            customDurationMinutes: data.customDurationMinutes !== undefined ? data.customDurationMinutes : undefined,
            isActive: data.isActive !== undefined ? data.isActive : undefined,
          },
          create: {
            branchId,
            serviceId,
            customPrice: data.customPrice,
            customDurationMinutes: data.customDurationMinutes !== undefined ? data.customDurationMinutes : null,
            isActive: data.isActive !== undefined ? data.isActive : true,
          },
        });

        await tx.servicePriceHistory.create({
          data: {
            serviceId,
            branchId,
            price: data.customPrice,
            changedBy: currentUser.id,
            reason: `Branch rule price override for ${branch.name}`,
          },
        });
      }

      return updated;
    });
  }

  /**
   * Get branch governance summary & metrics for Branch Governance Engine
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

    if (currentUser.role === "BRANCH_ADMIN" && currentUser.branchId !== branch.id) {
      throw new ForbiddenError("Forbidden: You do not have access to view governance for this branch.");
    }

    const branchServices = await prisma.branchService.findMany({
      where: { branchId: branch.id },
      include: {
        service: true,
      },
      orderBy: { service: { code: "asc" } },
    });

    const totalRituals = branchServices.length;
    const activeRituals = branchServices.filter((bs) => bs.isActive && bs.service.isActive).length;

    let totalPrice = 0;
    branchServices.forEach((bs) => {
      const price = bs.customPrice !== null ? Number(bs.customPrice) : Number(bs.service.basePrice);
      totalPrice += price;
    });
    const avgTicketPrice = totalRituals > 0 ? Math.round(totalPrice / totalRituals) : 820;

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
   * Get dynamic distinct category aggregations with service counts
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
