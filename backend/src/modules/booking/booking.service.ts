import prisma from "../../utils/prisma";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
} from "../../errors/AppError";
import { BookingStatus, UserRole } from "@prisma/client";
import { ServiceRitualService } from "../service/service.service";
import { EmployeeService } from "../employee/employee.service";
import { AvailabilityService } from "./availability.service";
import {
  MultiServiceSchedulingService,
  MultiServiceChainParams,
} from "./multiServiceScheduling.service";
import {
  AvailabilityQuery,
  CreateBookingInput,
  RescheduleBookingInput,
  StaffExceptionInput,
  CreateReviewInput,
} from "./booking.schema";

export interface CurrentUser {
  id: string;
  role: UserRole;
  branchId: string | null;
  phoneNumber?: string;
}

export class BookingService {
  /**
   * Helper to check branch isolation
   */
  private static checkBranchAccess(currentUser: CurrentUser, targetBranchId: string) {
    if (currentUser.role === "OWNER") return;
    if (currentUser.role === "BRANCH_ADMIN" && currentUser.branchId !== targetBranchId) {
      throw new ForbiddenError("Forbidden: branch access denied");
    }
  }

  /**
   * Calculate conflict-free available time slots for a branch, service, and date
   */
  static async getAvailableSlots(query: AvailabilityQuery) {
    return await AvailabilityService.calculateServiceSlots({
      branchId: query.branchId,
      serviceId: query.serviceId,
      employeeId: query.employeeId || undefined,
      date: query.date,
      timeZone: query.timeZone,
    });
  }

  /**
   * Calculate sequential multi-service chain slots
   */
  static async getMultiServiceSlots(params: MultiServiceChainParams) {
    return await MultiServiceSchedulingService.calculateMultiServiceChainSlots(params);
  }

  /**
   * Create an appointment with concurrency advisory locking and snapshot freezing
   */
  static async createBooking(input: CreateBookingInput, currentUser: CurrentUser) {
    const { branchId, notes } = input;
    const customerId = currentUser.id;

    // 1. Fetch branch
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { branchHours: true },
    });
    if (!branch || !branch.isActive) {
      throw new NotFoundError("Branch not found or inactive.");
    }

    // 2. Normalize requested items (multi-service items or single legacy item)
    const rawItems: Array<{
      serviceId: string;
      employeeId: string;
      startTime: Date;
      sequenceOrder: number;
    }> = [];

    if (input.items && input.items.length > 0) {
      input.items.forEach((item, idx) => {
        const start = new Date(item.startTime);
        if (isNaN(start.getTime())) throw new ValidationError("Invalid start time format.");
        rawItems.push({
          serviceId: item.serviceId,
          employeeId: item.employeeId,
          startTime: start,
          sequenceOrder: item.sequenceOrder !== undefined ? item.sequenceOrder : idx,
        });
      });
    } else if (input.serviceId && input.employeeId && input.startTime) {
      const start = new Date(input.startTime);
      if (isNaN(start.getTime())) throw new ValidationError("Invalid start time format.");
      rawItems.push({
        serviceId: input.serviceId,
        employeeId: input.employeeId,
        startTime: start,
        sequenceOrder: 0,
      });
    } else {
      throw new ValidationError("Booking items or service details are required.");
    }

    // Resolve details & snapshots for all items
    const preparedItems: Array<{
      service: any;
      employeeId: string;
      startTime: Date;
      endTime: Date;
      endTimeWithBuffer: Date;
      price: number;
      duration: number;
      turnaround: number;
      depositRequired: number;
      sequenceOrder: number;
    }> = [];
    let aggregateTotal = 0;
    let aggregateDeposit = 0;

    for (const item of rawItems) {
      const service = await ServiceRitualService.getServiceById(item.serviceId, currentUser, branchId);
      if (!service.isActive) {
        throw new ValidationError(`Service '${service.name}' is inactive.`);
      }

      const price = Number(service.effectivePrice);
      const duration = service.effectiveDuration || 60;
      const turnaround = service.effectiveTurnaround || 15;

      const depositCalc = await ServiceRitualService.getDepositCalculation(item.serviceId, branchId, price);
      const depositRequired = Number(depositCalc.depositAmount);

      aggregateTotal += price;
      aggregateDeposit += depositRequired;

      const endTime = new Date(item.startTime.getTime() + duration * 60000);
      const endTimeWithBuffer = new Date(endTime.getTime() + turnaround * 60000);

      preparedItems.push({
        service,
        employeeId: item.employeeId,
        startTime: item.startTime,
        endTime,
        endTimeWithBuffer,
        price,
        duration,
        turnaround,
        depositRequired,
        sequenceOrder: item.sequenceOrder,
      });
    }

    const totalAmount = aggregateTotal;
    const depositRequired = aggregateDeposit;
    const depositPaid = depositRequired;
    const balanceDue = Math.max(0, totalAmount - depositPaid);

    // 3. Concurrency Lock: Lock each distinct (employeeId, dateStr)
    const lockKeys = new Set<string>();
    for (const item of preparedItems) {
      const dStr = item.startTime.toISOString().split("T")[0];
      lockKeys.add(`bk_${item.employeeId}_${dStr}`);
    }

    const dateStr = preparedItems[0].startTime.toISOString().split("T")[0];

    return await prisma.$transaction(async (tx: any) => {
      // Acquire transaction-level advisory locks for all distinct specialist+day combinations
      for (const lockStr of lockKeys) {
        let hash = 0;
        for (let i = 0; i < lockStr.length; i++) {
          hash = ((hash << 5) - hash) + lockStr.charCodeAt(i);
          hash |= 0;
        }
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${hash})`;
      }

      // Check collision and working schedule for every item
      for (const item of preparedItems) {
        const schedule = await EmployeeService.getEffectiveScheduleForDate(item.employeeId, item.startTime);
        if (!schedule.isWorking || !schedule.startTime || !schedule.endTime) {
          throw new ConflictError("Specialist is not scheduled to work at this date/time.");
        }

        const conflictingBooking = await tx.bookingItem.findFirst({
          where: {
            employeeId: item.employeeId,
            booking: {
              status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.PENDING_PAYMENT] },
              OR: [
                { status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] } },
                { status: BookingStatus.PENDING_PAYMENT, reservationExpires: { gt: new Date() } },
              ],
            },
            OR: [
              { AND: [{ startTime: { lte: item.startTime } }, { endTime: { gt: item.startTime } }] },
              { AND: [{ startTime: { lt: item.endTimeWithBuffer } }, { endTime: { gte: item.endTimeWithBuffer } }] },
              { AND: [{ startTime: { gte: item.startTime } }, { endTime: { lte: item.endTimeWithBuffer } }] },
            ],
          },
        });

        if (conflictingBooking) {
          throw new ConflictError("Time slot collision / ይህ ሰዓት ተይዟል");
        }
      }

      // Canonical booking number
      const datePrefix = `EYOB-${dateStr.replace(/-/g, "")}`;
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const bookingNumber = `${datePrefix}-${randomSuffix}`;

      // Create Booking with all items
      const booking = await tx.booking.create({
        data: {
          bookingNumber,
          status: BookingStatus.CONFIRMED,
          totalAmount,
          depositRequired,
          depositPaid,
          balanceDue,
          reservationExpires: new Date(Date.now() + 15 * 60 * 1000),
          notes,
          customerId,
          branchId,
          employeeId: preparedItems[0]?.employeeId,
          items: {
            create: preparedItems.map((item) => ({
              serviceId: item.service.id,
              serviceTitleSnapshot: item.service.name,
              priceSnapshot: item.price,
              durationSnapshot: item.duration,
              depositSnapshot: item.depositRequired,
              snapshotServiceName: item.service.name,
              snapshotPrice: item.price,
              snapshotDurationMinutes: item.duration,
              snapshotDepositAmount: item.depositRequired,
              startTime: item.startTime,
              endTime: item.endTime,
              employeeId: item.employeeId,
              sequenceOrder: item.sequenceOrder,
            })),
          },
        },
        include: {
          items: {
            orderBy: { sequenceOrder: "asc" },
            include: {
              employee: {
                select: { id: true, firstName: true, lastName: true, ritualTitle: true, workstation: true },
              },
              service: {
                select: { id: true, code: true, name: true, amharicName: true },
              },
            },
          },
          branch: {
            select: { id: true, name: true, slug: true, addressLine: true, city: true },
          },
          customer: {
            select: { id: true, firstName: true, lastName: true, phone: true, email: true },
          },
        },
      });

      return booking;
    });
  }

  /**
   * Retrieve current customer's booking history
   */
  static async getMyBookings(currentUser: CurrentUser, statusFilter?: string) {
    const now = new Date();

    const bookings = await prisma.booking.findMany({
      where: {
        customerId: currentUser.id,
      },
      include: {
        items: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, ritualTitle: true, workstation: true },
            },
            service: {
              select: { id: true, code: true, name: true, amharicName: true },
            },
            review: true,
          },
        },
        branch: {
          select: { id: true, name: true, slug: true, addressLine: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!statusFilter || statusFilter === "ALL") {
      return bookings;
    }

    if (statusFilter === "UPCOMING") {
      return bookings.filter(
        (b: any) =>
          (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.PENDING_PAYMENT) &&
          b.items.some((item: any) => new Date(item.startTime) >= now)
      );
    }

    if (statusFilter === "PAST") {
      return bookings.filter(
        (b: any) =>
          b.status === BookingStatus.COMPLETED ||
          (b.status === BookingStatus.CONFIRMED && b.items.some((item: any) => new Date(item.endTime) < now))
      );
    }

    if (statusFilter === "CANCELLED") {
      return bookings.filter(
        (b: any) =>
          b.status === BookingStatus.CANCELLED ||
          b.status === BookingStatus.REJECTED ||
          b.status === BookingStatus.NO_SHOW ||
          b.status === BookingStatus.EXPIRED
      );
    }

    return bookings;
  }

  /**
   * Get single booking by UUID or Booking Number with IDOR protection
   */
  static async getBookingByIdOrRef(idOrRef: string, currentUser: CurrentUser) {
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id: idOrRef }, { bookingNumber: idOrRef }],
      },
      include: {
        items: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, ritualTitle: true, workstation: true },
            },
            service: {
              select: { id: true, code: true, name: true, amharicName: true },
            },
            review: true,
          },
        },
        branch: {
          select: { id: true, name: true, slug: true, addressLine: true, phoneNumber: true },
        },
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundError("Appointment booking not found.");
    }

    // Access control: Customer can only view their own booking
    if (currentUser.role === "CUSTOMER" && booking.customerId !== currentUser.id) {
      throw new ForbiddenError("Forbidden: You cannot access another patron's booking.");
    }

    // Branch Admin can only view bookings in their branch
    if (currentUser.role === "BRANCH_ADMIN" && booking.branchId !== currentUser.branchId) {
      throw new ForbiddenError("Forbidden: branch access denied.");
    }

    return booking;
  }

  /**
   * Cancel an appointment
   */
  static async cancelBooking(id: string, reason: string | undefined, currentUser: CurrentUser) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!booking) {
      throw new NotFoundError("Appointment not found.");
    }

    if (currentUser.role === "CUSTOMER" && booking.customerId !== currentUser.id) {
      throw new ForbiddenError("Forbidden: You cannot cancel another patron's appointment.");
    }

    if (currentUser.role === "BRANCH_ADMIN" && booking.branchId !== currentUser.branchId) {
      throw new ForbiddenError("Forbidden: branch access denied.");
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new ValidationError("Cannot cancel an already completed appointment.");
    }

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REJECTED) {
      throw new ValidationError("Appointment is already cancelled or rejected.");
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancellationReason: reason || "Cancelled by client",
      },
      include: { items: true },
    });

    return updated;
  }

  /**
   * Reschedule an appointment
   */
  static async rescheduleBooking(
    id: string,
    input: RescheduleBookingInput,
    currentUser: CurrentUser
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!booking) {
      throw new NotFoundError("Appointment not found.");
    }

    if (currentUser.role === "CUSTOMER" && booking.customerId !== currentUser.id) {
      throw new ForbiddenError("Forbidden: You cannot reschedule another patron's appointment.");
    }

    if (currentUser.role === "BRANCH_ADMIN" && booking.branchId !== currentUser.branchId) {
      throw new ForbiddenError("Forbidden: branch access denied.");
    }

    if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
      throw new ValidationError("Cannot reschedule a completed or cancelled appointment.");
    }

    const item = booking.items[0];
    if (!item) {
      throw new NotFoundError("Booking item not found.");
    }

    const targetEmployeeId = input.employeeId || item.employeeId;
    if (!targetEmployeeId) {
      throw new ValidationError("Specialist assignment required to reschedule.");
    }

    const newStart = new Date(input.newStartTime);
    const duration = item.durationSnapshot;
    const newEnd = new Date(newStart.getTime() + duration * 60000);
    const newEndWithBuffer = new Date(newEnd.getTime() + 15 * 60000);

    // Advisory lock for rescheduling target slot
    const dateStr = newStart.toISOString().split("T")[0];
    const lockStr = `bk_${targetEmployeeId}_${dateStr}`;
    let hash = 0;
    for (let i = 0; i < lockStr.length; i++) {
      hash = ((hash << 5) - hash) + lockStr.charCodeAt(i);
      hash |= 0;
    }

    return await prisma.$transaction(async (tx: any) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${hash})`;

      // Check collision with other bookings (excluding current item)
      const conflict = await tx.bookingItem.findFirst({
        where: {
          id: { not: item.id },
          employeeId: targetEmployeeId,
          booking: {
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.PENDING_PAYMENT] },
            OR: [
              { status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] } },
              { status: BookingStatus.PENDING_PAYMENT, reservationExpires: { gt: new Date() } },
            ],
          },
          AND: [
            { startTime: { lt: newEndWithBuffer } },
            { endTime: { gt: newStart } },
          ],
        },
      });

      if (conflict) {
        throw new ConflictError("The selected rescheduled time slot is unavailable. Please pick an alternative time.");
      }

      await tx.bookingItem.update({
        where: { id: item.id },
        data: {
          startTime: newStart,
          endTime: newEnd,
          employeeId: targetEmployeeId,
        },
      });

      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CONFIRMED,
        },
        include: {
          items: {
            include: {
              employee: true,
              service: true,
            },
          },
          branch: true,
        },
      });

      return updatedBooking;
    });
  }

  /**
   * Leave a review on a completed booking item
   */
  static async createReview(bookingItemId: string, input: CreateReviewInput, currentUser: CurrentUser) {
    const item = await prisma.bookingItem.findUnique({
      where: { id: bookingItemId },
      include: { booking: true },
    });

    if (!item) {
      throw new NotFoundError("Booking item not found.");
    }

    if (item.booking.customerId !== currentUser.id) {
      throw new ForbiddenError("You can only review your own appointments.");
    }

    if (item.booking.status !== BookingStatus.COMPLETED) {
      throw new ValidationError("You can only review completed appointments.");
    }

    const review = await prisma.review.upsert({
      where: { bookingItemId },
      update: {
        rating: input.rating,
        comment: input.comment,
      },
      create: {
        bookingItemId,
        rating: input.rating,
        comment: input.comment,
      },
    });

    return review;
  }

  /**
   * Retrieve staff appointments for today or specified date
   */
  static async getStaffAppointments(currentUser: CurrentUser, dateStr?: string, status?: string) {
    const andClauses: any[] = [];

    // 1. Employee scoping
    if (currentUser.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({
        where: {
          OR: [
            { userId: currentUser.id },
            ...(currentUser.phoneNumber ? [{ phone: currentUser.phoneNumber }] : []),
          ],
        },
      });
      if (emp) {
        andClauses.push({
          OR: [
            { employeeId: emp.id },
            { items: { some: { employeeId: emp.id } } },
          ],
        });
      }
    } else if (currentUser.role === "BRANCH_ADMIN") {
      if (currentUser.branchId) {
        andClauses.push({ branchId: currentUser.branchId });
      }
    }

    // 2. Date filtering
    if (dateStr) {
      const [y, m, d] = dateStr.split("-").map(Number);
      const startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
      const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);
      andClauses.push({
        items: {
          some: {
            startTime: { gte: startOfDay, lte: endOfDay },
          },
        },
      });
    }

    // 3. Status filtering
    if (status && status !== "ALL") {
      andClauses.push({ status: status as BookingStatus });
    }

    const where = andClauses.length > 0 ? { AND: andClauses } : {};

    const appointments = await prisma.booking.findMany({
      where,
      include: {
        items: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, ritualTitle: true, workstation: true } },
            service: { select: { id: true, code: true, name: true, amharicName: true } },
          },
        },
        branch: { select: { id: true, name: true, slug: true } },
        customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return appointments;
  }

  /**
   * Update appointment status (Accept, Reject, In-Progress, Complete, No-Show)
   */
  static async updateAppointmentStatus(
    bookingId: string,
    newStatus: BookingStatus,
    reason: string | undefined,
    currentUser: CurrentUser
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { items: true },
    });

    if (!booking) {
      throw new NotFoundError("Appointment booking not found.");
    }

    this.checkBranchAccess(currentUser, booking.branchId);

    // State machine transitions
    if (newStatus === BookingStatus.REJECTED) {
      return await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.REJECTED,
          cancellationReason: reason || "Rejected by salon specialist",
        },
      });
    }

    if (newStatus === BookingStatus.IN_PROGRESS) {
      return await prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.IN_PROGRESS },
      });
    }

    if (newStatus === BookingStatus.COMPLETED) {
      return await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.COMPLETED,
          balanceDue: 0,
        },
      });
    }

    if (newStatus === BookingStatus.CANCELLED) {
      return await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancellationReason: reason || "Cancelled by admin",
        },
      });
    }

    if (newStatus === BookingStatus.NO_SHOW) {
      return await prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.NO_SHOW },
      });
    }

    return await prisma.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
    });
  }

  /**
   * Get staff weekly availability and schedule exceptions
   */
  static async getStaffAvailability(currentUser: CurrentUser, targetEmployeeId?: string) {
    let empId = targetEmployeeId;

    if (!empId && currentUser.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({
        where: { userId: currentUser.id },
      });
      if (emp) empId = emp.id;
    }

    if (!empId) {
      throw new NotFoundError("Specialist record not found.");
    }

    const employee = await prisma.employee.findUnique({
      where: { id: empId },
      include: {
        schedules: { orderBy: { dayOfWeek: "asc" } },
        scheduleExceptions: {
          where: { date: { gte: new Date() } },
          orderBy: { date: "asc" },
        },
      },
    });

    if (!employee) {
      throw new NotFoundError("Specialist not found.");
    }

    this.checkBranchAccess(currentUser, employee.branchId);

    return employee;
  }

  /**
   * Log emergency leave / availability exception
   */
  static async toggleStaffException(
    input: StaffExceptionInput,
    currentUser: CurrentUser,
    targetEmployeeId?: string
  ) {
    let empId = targetEmployeeId;

    if (!empId && currentUser.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({
        where: { userId: currentUser.id },
      });
      if (emp) empId = emp.id;
    }

    if (!empId) {
      throw new NotFoundError("Specialist record not found.");
    }

    const employee = await prisma.employee.findUnique({
      where: { id: empId },
    });
    if (!employee) throw new NotFoundError("Specialist not found.");

    this.checkBranchAccess(currentUser, employee.branchId);

    const [y, m, d] = input.date.split("-").map(Number);
    const exceptionDate = new Date(Date.UTC(y, m - 1, d));

    const exception = await prisma.scheduleException.create({
      data: {
        employeeId: empId,
        date: exceptionDate,
        isWorking: input.isWorking,
        isOffDay: !input.isWorking,
        startTime: input.startTime,
        endTime: input.endTime,
        reason: input.reason || "Staff availability update",
      },
    });

    return exception;
  }

  /**
   * Admin master appointment oversight across branches
   */
  static async getAdminAppointments(
    currentUser: CurrentUser,
    query: {
      branchId?: string;
      date?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    let targetBranchId = query.branchId;
    if (currentUser.role === "BRANCH_ADMIN") {
      targetBranchId = currentUser.branchId || undefined;
    }

    const where: any = {};
    if (targetBranchId) {
      where.branchId = targetBranchId;
    }

    if (query.status && query.status !== "ALL") {
      where.status = query.status as BookingStatus;
    }

    if (query.date) {
      const [y, m, d] = query.date.split("-").map(Number);
      const startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
      const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);
      where.items = {
        some: {
          startTime: { gte: startOfDay, lte: endOfDay },
        },
      };
    }

    if (query.search) {
      where.OR = [
        { bookingNumber: { contains: query.search, mode: "insensitive" } },
        { customer: { firstName: { contains: query.search, mode: "insensitive" } } },
        { customer: { lastName: { contains: query.search, mode: "insensitive" } } },
        { customer: { phone: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [total, appointments] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: {
          items: {
            include: {
              employee: { select: { id: true, firstName: true, lastName: true, ritualTitle: true, workstation: true } },
              service: { select: { id: true, code: true, name: true, amharicName: true } },
            },
          },
          branch: { select: { id: true, name: true, slug: true } },
          customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    // Compute status counts for metrics bar
    const countsWhere = targetBranchId ? { branchId: targetBranchId } : {};
    const [totalAll, confirmed, inProgress, completed, cancelled, rejected] = await Promise.all([
      prisma.booking.count({ where: countsWhere }),
      prisma.booking.count({ where: { ...countsWhere, status: BookingStatus.CONFIRMED } }),
      prisma.booking.count({ where: { ...countsWhere, status: BookingStatus.IN_PROGRESS } }),
      prisma.booking.count({ where: { ...countsWhere, status: BookingStatus.COMPLETED } }),
      prisma.booking.count({ where: { ...countsWhere, status: BookingStatus.CANCELLED } }),
      prisma.booking.count({ where: { ...countsWhere, status: BookingStatus.REJECTED } }),
    ]);

    return {
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      counts: {
        total: totalAll,
        confirmed,
        inProgress,
        completed,
        cancelled,
        rejected,
      },
    };
  }

  /**
   * Income reporting: daily or monthly income from completed bookings
   */
  static async getIncomeReport(
    currentUser: CurrentUser,
    period: "DAILY" | "MONTHLY",
    branchId?: string,
    startDateStr?: string,
    endDateStr?: string
  ) {
    let targetBranchId = branchId;
    if (currentUser.role === "BRANCH_ADMIN") {
      targetBranchId = currentUser.branchId || undefined;
    }

    const where: any = {
      status: BookingStatus.COMPLETED,
    };

    if (targetBranchId) {
      where.branchId = targetBranchId;
    }

    if (startDateStr && endDateStr) {
      where.createdAt = {
        gte: new Date(startDateStr),
        lte: new Date(endDateStr),
      };
    }

    const completedBookings = await prisma.booking.findMany({
      where,
      select: {
        id: true,
        totalAmount: true,
        depositPaid: true,
        createdAt: true,
        branch: { select: { id: true, name: true } },
      },
    });

    const totalIncome = completedBookings.reduce(
      (sum: number, b: any) => sum + Number(b.totalAmount),
      0
    );
    const totalDeposits = completedBookings.reduce(
      (sum: number, b: any) => sum + Number(b.depositPaid),
      0
    );

    return {
      period,
      branchId: targetBranchId || "ALL",
      count: completedBookings.length,
      totalIncome,
      totalDeposits,
      bookings: completedBookings,
    };
  }
}
