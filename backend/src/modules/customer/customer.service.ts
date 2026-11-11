import prisma from "../../utils/prisma";
import { NotFoundError, ConflictError, ForbiddenError } from "../../errors/AppError";
import { UpdateProfileInput } from "./customer.schema";
import { UserRole } from "@prisma/client";

export interface CallerUser {
  id: string;
  role: UserRole;
  branchId: string | null;
  phoneNumber?: string;
}

export class CustomerService {
  /**
   * Get single customer profile by ID with strict access control.
   * Customer A querying Customer B throws 403 Forbidden.
   */
  static async getCustomerById(requestedId: string, caller: CallerUser) {
    if (caller.role === "CUSTOMER" && caller.id !== requestedId) {
      throw new ForbiddenError("Access denied: unauthorized profile query");
    }

    return this.getProfile(requestedId);
  }

  /**
   * List customers with search, pagination, and multi-branch visit metrics.
   * Restricted to OWNER and BRANCH_ADMIN.
   */
  static async listCustomers(
    filter: { search?: string; branchId?: string; page?: number; limit?: number },
    caller: CallerUser
  ) {
    if (caller.role !== "OWNER" && caller.role !== "BRANCH_ADMIN") {
      throw new ForbiddenError("Access denied: unauthorized clientele query");
    }

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const whereClause: any = {
      role: "CUSTOMER",
    };

    const targetBranchId =
      caller.role === "BRANCH_ADMIN"
        ? caller.branchId || undefined
        : filter.branchId && filter.branchId !== "all"
        ? filter.branchId
        : undefined;

    if (targetBranchId) {
      whereClause.bookings = { some: { branchId: targetBranchId } };
    }

    if (filter.search && filter.search.trim()) {
      const q = filter.search.trim();
      whereClause.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          preferredLang: true,
          smsNotifications: true,
          emailNotifications: true,
          createdAt: true,
          bookings: {
            select: {
              id: true,
              status: true,
              totalAmount: true,
              depositPaid: true,
              createdAt: true,
              branch: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const customers = users.map((u) => {
      const totalVisits = u.bookings.length;
      const completedVisits = u.bookings.filter((b) => b.status === "COMPLETED").length;
      const activeBookings = u.bookings.filter((b) =>
        ["CONFIRMED", "PENDING_PAYMENT", "IN_PROGRESS"].includes(b.status)
      ).length;

      const branchMap: Record<string, { branchId: string; branchName: string; count: number }> = {};
      for (const b of u.bookings) {
        if (b.branch) {
          if (!branchMap[b.branch.id]) {
            branchMap[b.branch.id] = {
              branchId: b.branch.id,
              branchName: b.branch.name,
              count: 0,
            };
          }
          branchMap[b.branch.id].count += 1;
        }
      }

      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        phone: u.phone,
        preferredLang: u.preferredLang,
        smsNotifications: u.smsNotifications,
        emailNotifications: u.emailNotifications,
        createdAt: u.createdAt,
        totalVisits,
        completedVisits,
        activeBookings,
        branchVisits: Object.values(branchMap),
      };
    });

    return {
      customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieve complete cross-branch appointment history for a customer dossier.
   */
  static async getCustomerHistory(customerId: string, caller: CallerUser) {
    if (caller.role === "CUSTOMER" && caller.id !== customerId) {
      throw new ForbiddenError("Access denied: unauthorized history query");
    }

    if (caller.role !== "OWNER" && caller.role !== "BRANCH_ADMIN" && caller.id !== customerId) {
      throw new ForbiddenError("Access denied: unauthorized history query");
    }

    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        preferredLang: true,
        createdAt: true,
      },
    });

    if (!customer) {
      throw new NotFoundError("Customer not found");
    }

    const bookings = await prisma.booking.findMany({
      where: { customerId },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            addressLine: true,
            phoneNumber: true,
          },
        },
        items: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                ritualTitle: true,
                workstation: true,
              },
            },
            service: {
              select: {
                id: true,
                code: true,
                name: true,
                amharicName: true,
                category: true,
              },
            },
            review: {
              select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
            transactionRef: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      customer: {
        ...customer,
        fullName: `${customer.firstName} ${customer.lastName}`.trim(),
      },
      appointments: bookings,
    };
  }
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        preferredLang: true,
        smsNotifications: true,
        emailNotifications: true,
        createdAt: true,
        updatedAt: true,
        bookings: {
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            totalAmount: true,
            depositPaid: true,
            createdAt: true,
            branch: {
              select: {
                id: true,
                name: true,
                slug: true,
                city: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("Customer profile not found");
    }

    // Compute visit statistics across all branches
    const totalBookings = user.bookings.length;
    const completedVisits = user.bookings.filter((b) => b.status === "COMPLETED").length;
    const activeBookings = user.bookings.filter((b) =>
      ["CONFIRMED", "PENDING_PAYMENT", "IN_PROGRESS"].includes(b.status)
    ).length;

    // Aggregate visits per branch
    const branchVisitsMap: Record<string, { branchId: string; branchName: string; count: number }> = {};
    for (const b of user.bookings) {
      if (b.branch) {
        if (!branchVisitsMap[b.branch.id]) {
          branchVisitsMap[b.branch.id] = {
            branchId: b.branch.id,
            branchName: b.branch.name,
            count: 0,
          };
        }
        branchVisitsMap[b.branch.id].count += 1;
      }
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isGlobalAccount: user.branchId === null,
      preferredLang: user.preferredLang,
      smsNotifications: user.smsNotifications,
      emailNotifications: user.emailNotifications,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      stats: {
        totalBookings,
        completedVisits,
        activeBookings,
        branchVisits: Object.values(branchVisitsMap),
      },
      recentBookings: user.bookings.slice(0, 5),
    };
  }

  static async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("Customer profile not found");
    }

    // Check email uniqueness if email provided and changed
    if (data.email !== undefined && data.email !== null && data.email.trim() !== "") {
      const normalizedEmail = data.email.toLowerCase().trim();
      if (normalizedEmail !== (user.email?.toLowerCase() || "")) {
        const existing = await prisma.user.findFirst({
          where: {
            email: normalizedEmail,
            id: { not: userId },
          },
        });
        if (existing) {
          throw new ConflictError("Email is already registered by another account");
        }
      }
    }

    // Check phone uniqueness if phone provided and changed
    if (data.phone !== undefined && data.phone.trim() !== "") {
      const normalizedPhone = data.phone.trim();
      if (normalizedPhone !== user.phone) {
        const existing = await prisma.user.findFirst({
          where: {
            phone: normalizedPhone,
            id: { not: userId },
          },
        });
        if (existing) {
          throw new ConflictError("Phone number is already registered by another account");
        }
      }
    }

    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName.trim();
    if (data.lastName !== undefined) updateData.lastName = data.lastName.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.email !== undefined) {
      updateData.email = data.email && data.email.trim() !== "" ? data.email.toLowerCase().trim() : null;
    }
    if (data.preferredLang !== undefined) updateData.preferredLang = data.preferredLang;
    if (data.smsNotifications !== undefined) updateData.smsNotifications = data.smsNotifications;
    if (data.emailNotifications !== undefined) updateData.emailNotifications = data.emailNotifications;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        preferredLang: true,
        smsNotifications: true,
        emailNotifications: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...updatedUser,
      isGlobalAccount: updatedUser.branchId === null,
    };
  }
}

