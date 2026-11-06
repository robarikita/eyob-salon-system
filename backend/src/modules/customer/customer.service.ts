import prisma from "../../utils/prisma";
import { NotFoundError, ConflictError } from "../../errors/AppError";
import { UpdateProfileInput } from "./customer.schema";

export class CustomerService {
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
