import prisma from "../../utils/prisma";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
} from "../../errors/AppError";
import { BookingStatus, UserRole, BranchHours } from "@prisma/client";
import { ServiceRitualService } from "../service/service.service";
import { EmployeeService } from "../employee/employee.service";
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
    const { branchId, serviceId, employeeId, date } = query;

    // 1. Fetch branch operating hours
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { branchHours: true },
    });

    if (!branch || !branch.isActive) {
      throw new NotFoundError("Branch not found or inactive.");
    }

    const [year, month, day] = date.split("-").map(Number);
    const targetDate = new Date(year, month - 1, day);
    const dayOfWeek = targetDate.getDay();

    const branchHour = branch.branchHours.find((bh: BranchHours) => bh.dayOfWeek === dayOfWeek);
    if (!branchHour || branchHour.isClosed) {
      return {
        date,
        branchId,
        serviceDuration: 0,
        turnaroundBuffer: 0,
        availableSlots: [],
      };
    }

    // 2. Fetch service details & buffers
    const dummyUser: CurrentUser = { id: "system", role: "CUSTOMER", branchId: null };
    const service = await ServiceRitualService.getServiceById(serviceId, dummyUser, branchId);
    if (!service.isActive) {
      throw new ValidationError("Service ritual is inactive and cannot be booked.");
    }

    const duration = service.effectiveDuration || 60;
    const turnaround = service.effectiveTurnaround || 15;
    const totalSlotBlock = duration + turnaround;
    const slotStepMinutes = branch.slotBufferMinutes || 15;

    // Parse branch open & close times into minutes from midnight
    const [openH, openM] = branchHour.openTime.split(":").map(Number);
    const [closeH, closeM] = branchHour.closeTime.split(":").map(Number);
    const branchOpenMinutes = openH * 60 + openM;
    let branchCloseMinutes = closeH * 60 + closeM;
    if (branchHour.closesNextDay || branchCloseMinutes <= branchOpenMinutes) {
      branchCloseMinutes += 24 * 60;
    }

    // 3. Determine target specialists
    let targetEmployeeIds: string[] = [];
    if (employeeId) {
      const emp = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          services: {
            where: { serviceId: service.id, isQualified: true },
          },
        },
      });
      if (!emp || emp.branchId !== branchId || !emp.status || !emp.isActive) {
        throw new NotFoundError("Specialist not found or inactive at this branch.");
      }
      // If specialist has configured services, check qualification
      if (emp.services.length === 0) {
        const totalAssigned = await prisma.employeeService.count({
          where: { employeeId: emp.id },
        });
        if (totalAssigned > 0) {
          return {
            date,
            branchId,
            serviceDuration: duration,
            turnaroundBuffer: turnaround,
            availableSlots: [],
          };
        }
      }
      targetEmployeeIds = [employeeId];
    } else {
      // Find all active specialists assigned to this service at this branch
      const serviceEmployees = await prisma.employeeService.findMany({
        where: {
          serviceId: service.id,
          isQualified: true,
          employee: {
            branchId,
            status: true,
            isActive: true,
          },
        },
        select: { employeeId: true },
      });

      targetEmployeeIds = serviceEmployees.map((se: { employeeId: string }) => se.employeeId);

      // Fallback: If no direct service assignment, query any active specialist at this branch
      if (targetEmployeeIds.length === 0) {
        const branchEmployees = await prisma.employee.findMany({
          where: { branchId, status: true, isActive: true },
          select: { id: true },
        });
        targetEmployeeIds = branchEmployees.map((e: { id: string }) => e.id);
      }
    }

    if (targetEmployeeIds.length === 0) {
      return {
        date,
        branchId,
        serviceDuration: duration,
        turnaroundBuffer: turnaround,
        availableSlots: [],
      };
    }

    // 4. Compute slots for each specialist and merge
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    const slotSet = new Set<string>();

    for (const empId of targetEmployeeIds) {
      // Check effective working hours for specialist on this date
      const effectiveSchedule = await EmployeeService.getEffectiveScheduleForDate(
        empId,
        targetDate
      );

      if (!effectiveSchedule.isWorking || !effectiveSchedule.startTime || !effectiveSchedule.endTime) {
        continue;
      }

      const [shiftStartH, shiftStartM] = effectiveSchedule.startTime.split(":").map(Number);
      const [shiftEndH, shiftEndM] = effectiveSchedule.endTime.split(":").map(Number);
      const shiftStartMinutes = shiftStartH * 60 + shiftStartM;
      let shiftEndMinutes = shiftEndH * 60 + shiftEndM;
      if (branchHour.closesNextDay && shiftEndMinutes <= shiftStartMinutes) {
        shiftEndMinutes += 24 * 60;
      }

      let breakStartMinutes: number | null = null;
      let breakEndMinutes: number | null = null;
      if (effectiveSchedule.breakStartTime && effectiveSchedule.breakEndTime) {
        const [bsh, bsm] = effectiveSchedule.breakStartTime.split(":").map(Number);
        const [beh, bem] = effectiveSchedule.breakEndTime.split(":").map(Number);
        breakStartMinutes = bsh * 60 + bsm;
        breakEndMinutes = beh * 60 + bem;
      }

      // Bound shift by branch hours
      const effectiveStart = Math.max(branchOpenMinutes, shiftStartMinutes);
      const effectiveEnd = Math.min(branchCloseMinutes, shiftEndMinutes);

      // Fetch existing bookings for this employee on this date
      const existingBookings = await prisma.bookingItem.findMany({
        where: {
          employeeId: empId,
          startTime: { gte: startOfDay, lte: endOfDay },
          booking: {
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.PENDING_PAYMENT] },
            OR: [
              { status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] } },
              { status: BookingStatus.PENDING_PAYMENT, reservationExpires: { gt: new Date() } },
            ],
          },
        },
        select: {
          startTime: true,
          endTime: true,
          durationSnapshot: true,
        },
      });

      // Convert existing bookings to minutes from midnight
      const bookedRanges = existingBookings.map((b: { startTime: Date; endTime: Date }) => {
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        const startMin = bStart.getHours() * 60 + bStart.getMinutes();
        const endMin = bEnd.getHours() * 60 + bEnd.getMinutes();
        return {
          start: startMin,
          end: endMin + turnaround, // include turnaround buffer
        };
      });

      // Evaluate candidate slot starts
      for (let cur = effectiveStart; cur + duration <= effectiveEnd; cur += slotStepMinutes) {
        const curEnd = cur + duration;
        const curEndWithBuffer = cur + totalSlotBlock;

        // Check break overlap
        if (breakStartMinutes !== null && breakEndMinutes !== null) {
          if (cur < breakEndMinutes && curEnd > breakStartMinutes) {
            continue;
          }
        }

        // Check collision with existing booked items
        const hasCollision = bookedRanges.some((range: { start: number; end: number }) => {
          return cur < range.end && curEndWithBuffer > range.start;
        });

        if (!hasCollision) {
          const hh = String(Math.floor(cur / 60)).padStart(2, "0");
          const mm = String(cur % 60).padStart(2, "0");
          slotSet.add(`${hh}:${mm}`);
        }
      }
    }

    const availableSlots = Array.from(slotSet).sort();

    return {
      date,
      branchId,
      serviceDuration: duration,
      turnaroundBuffer: turnaround,
      availableSlots,
    };
  }

  /**
   * Create an appointment with concurrency advisory locking and snapshot freezing
   */
  static async createBooking(input: CreateBookingInput, currentUser: CurrentUser) {
    const { branchId, serviceId, employeeId, startTime: startTimeStr, notes } = input;
    const startTime = new Date(startTimeStr);

    if (isNaN(startTime.getTime())) {
      throw new ValidationError("Invalid start time format.");
    }

    const customerId = currentUser.id;

    // 1. Fetch branch
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { branchHours: true },
    });
    if (!branch || !branch.isActive) {
      throw new NotFoundError("Branch not found or inactive.");
    }

    // 2. Fetch service details & snapshots
    const service = await ServiceRitualService.getServiceById(serviceId, currentUser, branchId);
    if (!service.isActive) {
      throw new ValidationError("Service ritual is inactive.");
    }

    const price = service.effectivePrice;
    const duration = service.effectiveDuration || 60;
    const turnaround = service.effectiveTurnaround || 15;

    // Dynamically resolve deposit via 3-tier priority hierarchy
    const depositCalc = await ServiceRitualService.getDepositCalculation(serviceId, branchId, price);
    const depositRequired = depositCalc.depositAmount;
    const totalAmount = price;
    const depositPaid = depositRequired;
    const balanceDue = Math.max(0, totalAmount - depositPaid);

    const endTime = new Date(startTime.getTime() + duration * 60000);
    const endTimeWithBuffer = new Date(endTime.getTime() + turnaround * 60000);

    // 3. Concurrency Lock: Use PostgreSQL advisory lock on hash(employeeId + date)
    const dateStr = startTime.toISOString().split("T")[0];
    const lockStr = `bk_${employeeId}_${dateStr}`;
    let hash = 0;
    for (let i = 0; i < lockStr.length; i++) {
      hash = ((hash << 5) - hash) + lockStr.charCodeAt(i);
      hash |= 0;
    }

    return await prisma.$transaction(async (tx: any) => {
      // Acquire transaction-level advisory lock
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${hash})`;

      // Verify specialist schedule for this date
      const schedule = await EmployeeService.getEffectiveScheduleForDate(employeeId, startTime);
      if (!schedule.isWorking || !schedule.startTime || !schedule.endTime) {
        throw new ConflictError("Specialist is not scheduled to work at this date/time.");
      }

      // Check collision with unexpired / confirmed bookings
      const conflictingBooking = await tx.bookingItem.findFirst({
        where: {
          employeeId,
          booking: {
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.PENDING_PAYMENT] },
            OR: [
              { status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] } },
              { status: BookingStatus.PENDING_PAYMENT, reservationExpires: { gt: new Date() } },
            ],
          },
          AND: [
            { startTime: { lt: endTimeWithBuffer } },
            { endTime: { gt: startTime } },
          ],
        },
      });

      if (conflictingBooking) {
        throw new ConflictError("The selected time slot has just been reserved by another client. Please select an adjacent time.");
      }

      // Generate canonical bookingNumber: EYOB-YYYYMMDD-XXXX
      const datePrefix = `EYOB-${dateStr.replace(/-/g, "")}`;
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const bookingNumber = `${datePrefix}-${randomSuffix}`;

      // Create Booking
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
          items: {
            create: {
              serviceId: service.id,
              serviceTitleSnapshot: service.name,
              priceSnapshot: price,
              durationSnapshot: duration,
              depositSnapshot: depositRequired,
              snapshotServiceName: service.name,
              snapshotPrice: price,
              snapshotDurationMinutes: duration,
              snapshotDepositAmount: depositRequired,
              startTime,
              endTime,
              employeeId,
            },
          },
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
