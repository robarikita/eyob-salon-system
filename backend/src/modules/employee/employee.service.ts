import prisma from "../../utils/prisma";
import { UserRole } from "@prisma/client";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors/AppError";
import { hashPassword } from "../../utils/password";
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  AssignServicesInput,
  SetEmployeeScheduleInput,
  CreateExceptionInput,
} from "./employee.schema";

interface CurrentUser {
  id: string;
  role: UserRole;
  branchId: string | null;
  phoneNumber?: string;
}

export class EmployeeService {
  /**
   * Helper to verify if currentUser has access to a branch
   */
  private static checkBranchAccess(currentUser: CurrentUser, targetBranchId: string) {
    if (currentUser.role === "OWNER") return;
    if (currentUser.role === "BRANCH_ADMIN") {
      if (currentUser.branchId !== targetBranchId) {
        throw new ForbiddenError("Forbidden: You do not have access to manage employees in this branch.");
      }
      return;
    }
    throw new ForbiddenError("Forbidden: Insufficient privileges.");
  }

  /**
   * Strip sensitive financial compensation data (baseSalary, commissionRate)
   * unless caller is OWNER or the employee viewing their own profile.
   */
  private static sanitizeFinancialData(employee: any, currentUser: CurrentUser): any {
    if (!employee) return employee;
    const isOwner = currentUser.role === "OWNER";
    const isSelf =
      currentUser.role === "EMPLOYEE" &&
      (employee.userId === currentUser.id || employee.id === currentUser.id);

    if (isOwner || isSelf) {
      return employee;
    }

    const sanitized = { ...employee };
    delete sanitized.baseSalary;
    delete sanitized.commissionRate;
    return sanitized;
  }

  /**
   * Split full name into first and last name
   */
  private static splitName(fullName: string) {
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || parts[0];
    return { firstName, lastName };
  }

  /**
   * Create an employee with optional portal access User creation
   */
  static async createEmployee(data: CreateEmployeeInput, currentUser: CurrentUser) {
    this.checkBranchAccess(currentUser, data.branchId);

    // Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: data.branchId },
      include: { branchHours: true },
    });
    if (!branch) {
      throw new NotFoundError("Selected branch does not exist.");
    }

    const { firstName, lastName } = this.splitName(data.fullName);

    return prisma.$transaction(async (tx) => {
      let createdUserId: string | null = null;

      // Handle portal access account creation
      if (data.createPortalAccess) {
        // Check if phone or email is already taken
        const existingUserByPhone = await tx.user.findUnique({
          where: { phone: data.phone },
        });
        if (existingUserByPhone) {
          throw new ValidationError(`A user account with phone ${data.phone} already exists.`);
        }

        if (data.email) {
          const existingUserByEmail = await tx.user.findUnique({
            where: { email: data.email },
          });
          if (existingUserByEmail) {
            throw new ValidationError(`A user account with email ${data.email} already exists.`);
          }
        }

        const rawPassword = data.tempPassword || "EyobSanctuary#2025!";
        const hashedPassword = await hashPassword(rawPassword);

        const newUser = await tx.user.create({
          data: {
            firstName,
            lastName,
            email: data.email || null,
            phone: data.phone,
            password: hashedPassword,
            role: UserRole.EMPLOYEE,
            branchId: data.branchId,
          },
        });

        createdUserId = newUser.id;
      }

      // Create employee
      const employee = await tx.employee.create({
        data: {
          firstName,
          lastName,
          amharicName: data.amharicName || null,
          phone: data.phone,
          email: data.email || null,
          branchId: data.branchId,
          ritualTitle: data.ritualTitle || null,
          employmentType: data.employmentType || "Full-Time (40 hrs/wk)",
          workstation: data.workstation || null,
          joinedDate: data.joinedDate ? new Date(data.joinedDate) : new Date(),
          emergencyContactName: data.emergencyContactName || null,
          emergencyContactPhone: data.emergencyContactPhone || null,
          baseSalary: data.baseSalary !== undefined && data.baseSalary !== null ? data.baseSalary : null,
          commissionRate: data.commissionRate !== undefined && data.commissionRate !== null ? data.commissionRate : 15,
          userId: createdUserId,
        },
        include: {
          branch: true,
          user: {
            select: { id: true, email: true, phone: true, role: true },
          },
        },
      });

      // Default 7-day schedule adhering to standard hours
      const defaultSchedules = Array.from({ length: 7 }, (_, dayOfWeek) => {
        const isMonday = dayOfWeek === 1; // 1 is Monday rest day in sanctuary
        return {
          employeeId: employee.id,
          dayOfWeek,
          startTime: "08:30",
          endTime: "17:30",
          breakStartTime: "13:00",
          breakEndTime: "14:00",
          isWorking: !isMonday,
        };
      });

      await tx.employeeSchedule.createMany({
        data: defaultSchedules,
      });

      return employee;
    });
  }

  /**
   * Get all employees with filtering & branch scoping
   */
  static async getEmployees(
    filter: {
      branchId?: string;
      status?: boolean;
      search?: string;
      ritualCategory?: string;
    },
    currentUser: CurrentUser
  ) {
    if (currentUser.role === "BRANCH_ADMIN") {
      if (filter.branchId && filter.branchId !== "all" && filter.branchId !== currentUser.branchId) {
        throw new ForbiddenError("Forbidden: You do not have access to view employees outside your assigned branch.");
      }
    }

    let effectiveBranchId = filter.branchId;

    if (currentUser.role === "BRANCH_ADMIN") {
      effectiveBranchId = currentUser.branchId || undefined;
    } else if (effectiveBranchId === "all") {
      effectiveBranchId = undefined;
    }

    const where: any = {};

    if (effectiveBranchId) {
      where.branchId = effectiveBranchId;
    }

    if (filter.status !== undefined) {
      where.status = filter.status;
    }

    if (filter.search) {
      const q = filter.search.trim();
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { amharicName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { ritualTitle: { contains: q, mode: "insensitive" } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        branch: {
          select: { id: true, name: true, slug: true },
        },
        services: {
          include: {
            service: true,
          },
        },
        schedules: {
          orderBy: { dayOfWeek: "asc" },
        },
        _count: {
          select: {
            services: true,
            bookingItems: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return employees.map((emp) => this.sanitizeFinancialData(emp, currentUser));
  }

  /**
   * Get employee by ID (Enforces IDOR access controls & financial sanitization)
   */
  static async getEmployeeById(id: string, currentUser: CurrentUser) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        branch: true,
        user: {
          select: { id: true, email: true, phone: true, role: true },
        },
        services: {
          include: {
            service: true,
          },
        },
        schedules: {
          orderBy: { dayOfWeek: "asc" },
        },
        scheduleExceptions: {
          orderBy: { date: "asc" },
        },
        bookingItems: {
          take: 5,
          orderBy: { startTime: "desc" },
          include: {
            booking: true,
            review: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundError("Employee not found.");
    }

    // IDOR Check: An EMPLOYEE can only view their own profile
    if (currentUser.role === "EMPLOYEE") {
      const isSelf = employee.userId === currentUser.id || employee.id === currentUser.id;
      if (!isSelf) {
        throw new ForbiddenError("Forbidden: Access denied. Employees cannot view other specialists' private profiles.");
      }
    } else {
      // BRANCH_ADMIN or OWNER branch check
      this.checkBranchAccess(currentUser, employee.branchId);
    }

    return this.sanitizeFinancialData(employee, currentUser);
  }

  /**
   * Update employee details
   */
  static async updateEmployee(id: string, data: UpdateEmployeeInput, currentUser: CurrentUser) {
    const existing = await prisma.employee.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundError("Employee not found.");
    }

    this.checkBranchAccess(currentUser, existing.branchId);

    // If changing branchId, verify new branch access
    if (data.branchId && data.branchId !== existing.branchId) {
      this.checkBranchAccess(currentUser, data.branchId);
    }

    let firstName = existing.firstName;
    let lastName = existing.lastName;

    if (data.fullName) {
      const split = this.splitName(data.fullName);
      firstName = split.firstName;
      lastName = split.lastName;
    }

    const updateData: any = {
      firstName,
      lastName,
      amharicName: data.amharicName !== undefined ? data.amharicName : existing.amharicName,
      phone: data.phone !== undefined ? data.phone : existing.phone,
      email: data.email !== undefined ? data.email : existing.email,
      branchId: data.branchId !== undefined ? data.branchId : existing.branchId,
      ritualTitle: data.ritualTitle !== undefined ? data.ritualTitle : existing.ritualTitle,
      employmentType: data.employmentType !== undefined ? data.employmentType : existing.employmentType,
      workstation: data.workstation !== undefined ? data.workstation : existing.workstation,
      emergencyContactName: data.emergencyContactName !== undefined ? data.emergencyContactName : existing.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone !== undefined ? data.emergencyContactPhone : existing.emergencyContactPhone,
    };

    if (data.joinedDate) {
      updateData.joinedDate = new Date(data.joinedDate);
    }
    if (data.baseSalary !== undefined) {
      updateData.baseSalary = data.baseSalary;
    }
    if (data.commissionRate !== undefined) {
      updateData.commissionRate = data.commissionRate;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    } else if (data.isActive !== undefined) {
      updateData.status = data.isActive;
    }

    return prisma.employee.update({
      where: { id },
      data: updateData,
      include: {
        branch: true,
        user: { select: { id: true, email: true, phone: true } },
      },
    });
  }

  /**
   * Toggle employee active status (soft deactivation)
   * Warns if future bookings exist.
   */
  static async toggleEmployeeStatus(id: string, currentUser: CurrentUser) {
    const employee = await prisma.employee.findUnique({
      where: { id },
    });
    if (!employee) {
      throw new NotFoundError("Employee not found.");
    }

    this.checkBranchAccess(currentUser, employee.branchId);

    const newStatus = !employee.status;

    let warning: string | undefined;

    // If deactivating, check future bookings
    if (!newStatus) {
      const now = new Date();
      const futureBookingsCount = await prisma.bookingItem.count({
        where: {
          employeeId: id,
          startTime: { gte: now },
          booking: {
            status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
          },
        },
      });

      if (futureBookingsCount > 0) {
        warning = `Employee has ${futureBookingsCount} future appointment(s) that may require reassignment.`;
      }
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: { status: newStatus },
      include: { branch: true },
    });

    return { employee: updated, warning };
  }

  /**
   * Assign services with cross-branch service protection
   */
  static async assignServices(id: string, data: AssignServicesInput, currentUser: CurrentUser) {
    const employee = await prisma.employee.findUnique({
      where: { id },
    });
    if (!employee) {
      throw new NotFoundError("Employee not found.");
    }

    this.checkBranchAccess(currentUser, employee.branchId);

    // Cross-branch service protection
    if (data.services.length > 0) {
      const serviceIds = data.services.map((s) => s.serviceId);
      const services = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
      });

      if (services.length !== serviceIds.length) {
        throw new NotFoundError("One or more assigned services were not found in the catalog.");
      }

      const branchServices = await prisma.branchService.findMany({
        where: {
          serviceId: { in: serviceIds },
          branchId: employee.branchId,
        },
      });
      const validBranchServiceIds = new Set(branchServices.map((bs) => bs.serviceId));

      for (const service of services) {
        const isBranchMatch = service.branchId === employee.branchId;
        const isDeployedToBranch = validBranchServiceIds.has(service.id);
        const isGlobal = !service.branchId;

        if (!isBranchMatch && !isDeployedToBranch && !isGlobal) {
          throw new ValidationError(
            `Cross-Branch Violation: Service '${service.name}' belongs to branch ${service.branchId}, which differs from employee branch ${employee.branchId}.`
          );
        }
      }
    }

    return prisma.$transaction(async (tx) => {
      // Remove current services
      await tx.employeeService.deleteMany({
        where: { employeeId: id },
      });

      // Insert new services
      if (data.services.length > 0) {
        await tx.employeeService.createMany({
          data: data.services.map((item) => ({
            employeeId: id,
            serviceId: item.serviceId,
            customDurationMinutes: item.customDurationMinutes || null,
            customCommissionRate: item.customCommissionRate !== undefined ? item.customCommissionRate : null,
          })),
        });
      }

      return tx.employeeService.findMany({
        where: { employeeId: id },
        include: { service: true },
      });
    });
  }

  /**
   * Set employee schedule with branch operating hours validation
   */
  static async setSchedule(id: string, data: SetEmployeeScheduleInput, currentUser: CurrentUser) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        branch: {
          include: { branchHours: true },
        },
      },
    });
    if (!employee) {
      throw new NotFoundError("Employee not found.");
    }

    this.checkBranchAccess(currentUser, employee.branchId);

    const branchHoursMap = new Map<number, { openTime: string; closeTime: string; isClosed: boolean; closesNextDay: boolean }>();
    employee.branch.branchHours.forEach((bh) => {
      branchHoursMap.set(bh.dayOfWeek, {
        openTime: bh.openTime,
        closeTime: bh.closeTime,
        isClosed: bh.isClosed,
        closesNextDay: bh.closesNextDay ?? false,
      });
    });

    // Validate each day's working window
    for (const schedule of data.schedules) {
      if (schedule.isWorking) {
        const branchHour = branchHoursMap.get(schedule.dayOfWeek);
        if (branchHour && branchHour.isClosed) {
          throw new ValidationError(
            `Schedule Validation Error: Branch is closed on day of week ${schedule.dayOfWeek}. Employee cannot be scheduled to work.`
          );
        }

        if (branchHour) {
          if (branchHour.closesNextDay) {
            const [bOpenH, bOpenM] = branchHour.openTime.split(":").map(Number);
            const [bCloseH, bCloseM] = branchHour.closeTime.split(":").map(Number);
            const bOpenMin = bOpenH * 60 + bOpenM;
            let bCloseMin = bCloseH * 60 + bCloseM;
            if (bCloseMin <= bOpenMin) bCloseMin += 24 * 60;

            const [sStartH, sStartM] = schedule.startTime.split(":").map(Number);
            const [sEndH, sEndM] = schedule.endTime.split(":").map(Number);
            const sStartMin = sStartH * 60 + sStartM;
            let sEndMin = sEndH * 60 + sEndM;
            if (sEndMin <= sStartMin) sEndMin += 24 * 60;

            if (sStartMin < bOpenMin || sEndMin > bCloseMin) {
              throw new ValidationError(
                `Schedule Validation Error: Shift on day ${schedule.dayOfWeek} (${schedule.startTime} - ${schedule.endTime}) falls outside branch operating hours (${branchHour.openTime} - ${branchHour.closeTime}).`
              );
            }
          } else {
            if (schedule.startTime < branchHour.openTime || schedule.endTime > branchHour.closeTime) {
              throw new ValidationError(
                `Schedule Validation Error: Shift on day ${schedule.dayOfWeek} (${schedule.startTime} - ${schedule.endTime}) falls outside branch operating hours (${branchHour.openTime} - ${branchHour.closeTime}).`
              );
            }
            if (schedule.startTime >= schedule.endTime) {
              throw new ValidationError(`Shift start time (${schedule.startTime}) must precede end time (${schedule.endTime}).`);
            }
          }
        } else {
          if (schedule.startTime >= schedule.endTime) {
            throw new ValidationError(`Shift start time (${schedule.startTime}) must precede end time (${schedule.endTime}).`);
          }
        }

        if (schedule.breakStartTime && schedule.breakEndTime) {
          if (schedule.breakStartTime < schedule.startTime || schedule.breakEndTime > schedule.endTime) {
            throw new ValidationError(
              `Break times (${schedule.breakStartTime} - ${schedule.breakEndTime}) must be inside the working window (${schedule.startTime} - ${schedule.endTime}).`
            );
          }
          if (schedule.breakStartTime >= schedule.breakEndTime) {
            throw new ValidationError("Break start time must precede break end time.");
          }
        }
      }
    }

    return prisma.$transaction(async (tx) => {
      for (const schedule of data.schedules) {
        await tx.employeeSchedule.upsert({
          where: {
            employeeId_dayOfWeek: {
              employeeId: id,
              dayOfWeek: schedule.dayOfWeek,
            },
          },
          update: {
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            breakStartTime: schedule.breakStartTime || null,
            breakEndTime: schedule.breakEndTime || null,
            isWorking: schedule.isWorking,
          },
          create: {
            employeeId: id,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            breakStartTime: schedule.breakStartTime || null,
            breakEndTime: schedule.breakEndTime || null,
            isWorking: schedule.isWorking,
          },
        });
      }

      return tx.employeeSchedule.findMany({
        where: { employeeId: id },
        orderBy: { dayOfWeek: "asc" },
      });
    });
  }

  /**
   * Create an exception / leave request for an employee
   */
  static async createException(id: string, data: CreateExceptionInput, currentUser: CurrentUser) {
    const employee = await prisma.employee.findUnique({
      where: { id },
    });
    if (!employee) {
      throw new NotFoundError("Employee not found.");
    }

    this.checkBranchAccess(currentUser, employee.branchId);

    return prisma.scheduleException.create({
      data: {
        employeeId: id,
        date: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        reason: data.reason || null,
        isWorking: !data.isOffDay,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
      },
    });
  }

  /**
   * Get KPI Metrics & Operational Telemetry across branches
   */
  static async getDashboardMetrics(currentUser: CurrentUser, targetBranchId?: string) {
    let effectiveBranchId = targetBranchId;

    if (currentUser.role === "BRANCH_ADMIN") {
      effectiveBranchId = currentUser.branchId || undefined;
    }

    const branchFilter = effectiveBranchId ? { branchId: effectiveBranchId } : {};

    const totalActive = await prisma.employee.count({
      where: { ...branchFilter, status: true },
    });

    const totalEmployees = await prisma.employee.count({
      where: branchFilter,
    });

    const currentDayOfWeek = new Date().getDay();

    // On duty today: employees working on today's dayOfWeek
    const onDutyCount = await prisma.employee.count({
      where: {
        ...branchFilter,
        status: true,
        schedules: {
          some: {
            dayOfWeek: currentDayOfWeek,
            isWorking: true,
          },
        },
      },
    });

    // Commission pool calculation derived strictly from database compensation settings
    const activeStaffForCommission = await prisma.employee.findMany({
      where: { ...branchFilter, status: true },
      select: { baseSalary: true, commissionRate: true },
    });
    const calculatedCommissionPool = activeStaffForCommission.reduce((acc, staff) => {
      const salary = staff.baseSalary ? Number(staff.baseSalary) : 0;
      const rate = staff.commissionRate ? Number(staff.commissionRate) / 100 : 0;
      return acc + (salary * rate);
    }, 0);

    // Branch breakdown
    const branches = await prisma.branch.findMany({
      where: effectiveBranchId ? { id: effectiveBranchId } : { isActive: true },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    const branchBreakdown = await Promise.all(
      branches.map(async (b) => {
        const activeCount = await prisma.employee.count({
          where: { branchId: b.id, status: true },
        });
        const onDuty = await prisma.employee.count({
          where: {
            branchId: b.id,
            status: true,
            schedules: {
              some: { dayOfWeek: currentDayOfWeek, isWorking: true },
            },
          },
        });
        return {
          id: b.id,
          name: b.name,
          slug: b.slug,
          totalEmployees: b._count.employees,
          activeEmployees: activeCount,
          onDutyEmployees: onDuty,
          occupancyRate: activeCount > 0 ? Math.min(Math.round((onDuty / activeCount) * 100), 100) : 0,
        };
      })
    );

    return {
      totalActiveSpecialists: totalActive,
      totalEmployees,
      onDutyToday: onDutyCount,
      utilizationRate: totalActive > 0 ? Math.round((onDutyCount / totalActive) * 100) : 0,
      totalCommissionPool: Math.round(calculatedCommissionPool),
      branchBreakdown,
    };
  }

  /**
   * Determine effective schedule on a specific date, enforcing Schedule Exception precedence
   */
  static async getEffectiveScheduleForDate(employeeId: string, targetDate: Date | string) {
    const dateObj = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
    const dayOfWeek = dateObj.getDay();

    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Check for specific ScheduleException on this date (or range)
    const exception = await prisma.scheduleException.findFirst({
      where: {
        employeeId,
        OR: [
          {
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          {
            date: { lte: endOfDay },
            endDate: { gte: startOfDay },
          },
        ],
      },
      orderBy: { date: "desc" },
    });

    if (exception) {
      return {
        isWorking: exception.isWorking,
        isException: true,
        reason: exception.reason,
        startTime: exception.startTime,
        endTime: exception.endTime,
      };
    }

    // 2. Fall back to standard weekly schedule
    const standardSchedule = await prisma.employeeSchedule.findUnique({
      where: {
        employeeId_dayOfWeek: {
          employeeId,
          dayOfWeek,
        },
      },
    });

    return {
      isWorking: standardSchedule ? standardSchedule.isWorking : false,
      isException: false,
      reason: null,
      startTime: standardSchedule?.startTime || null,
      endTime: standardSchedule?.endTime || null,
      breakStartTime: standardSchedule?.breakStartTime || null,
      breakEndTime: standardSchedule?.breakEndTime || null,
    };
  }
}

