import prisma from "../../utils/prisma";
import { BookingStatus, BranchHours } from "@prisma/client";
import { NotFoundError, ValidationError } from "../../errors/AppError";
import { ServiceRitualService } from "../service/service.service";
import { EmployeeService } from "../employee/employee.service";

export interface CalculateSlotsParams {
  branchId: string;
  serviceId: string;
  employeeId?: string | null;
  date: string; // "YYYY-MM-DD"
  timeZone?: string;
  bufferMinutes?: number;
}

export interface DetailedSlot {
  time: string; // "HH:MM" in Addis local time
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  availableEmployeeIds: string[];
}

export interface AvailabilityResult {
  date: string;
  branchId: string;
  serviceId: string;
  serviceDuration: number;
  turnaroundBuffer: number;
  availableSlots: string[]; // ["09:00", "09:30", ...]
  slots: DetailedSlot[];
}

export class AvailabilityService {
  /**
   * Helper to get Addis Ababa current local time parts (UTC+3)
   */
  static getAddisAbabaCurrentTime(timeZone = "Africa/Addis_Ababa") {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const getVal = (type: string) => parts.find((p) => p.type === type)?.value || "0";

    const year = parseInt(getVal("year"), 10);
    const month = parseInt(getVal("month"), 10);
    const day = parseInt(getVal("day"), 10);
    let hour = parseInt(getVal("hour"), 10);
    if (hour === 24) hour = 0; // standard formatting fix
    const minute = parseInt(getVal("minute"), 10);

    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const minutesFromMidnight = hour * 60 + minute;

    return {
      year,
      month,
      day,
      hour,
      minute,
      dateStr,
      minutesFromMidnight,
      rawDate: now,
    };
  }

  /**
   * Calculate dynamic, conflict-free time slots strictly adhering to database state
   */
  static async calculateServiceSlots(params: CalculateSlotsParams): Promise<AvailabilityResult> {
    const { branchId, serviceId, employeeId, date, timeZone = "Africa/Addis_Ababa", bufferMinutes = 15 } = params;

    // STEP A: Branch Hours
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { branchHours: true },
    });

    if (!branch || !branch.isActive) {
      throw new NotFoundError("Branch not found or inactive.");
    }

    const [year, month, day] = date.split("-").map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const dayOfWeek = targetDate.getUTCDay();

    const branchHour = branch.branchHours.find((bh: BranchHours) => bh.dayOfWeek === dayOfWeek);
    if (!branchHour || branchHour.isClosed) {
      return {
        date,
        branchId,
        serviceId,
        serviceDuration: 0,
        turnaroundBuffer: 0,
        availableSlots: [],
        slots: [],
      };
    }

    // STEP B: Service Details & Durations
    const dummyUser = { id: "system", role: "CUSTOMER" as any, branchId: null };
    const service = await ServiceRitualService.getServiceById(serviceId, dummyUser, branchId);
    if (!service.isActive) {
      throw new ValidationError("Service ritual is inactive and cannot be booked.");
    }

    const duration = service.effectiveDuration || 60;
    const turnaround = service.effectiveTurnaround || 15;
    const totalSlotBlock = duration + turnaround;
    const slotStepMinutes = branch.slotBufferMinutes || 15;

    // Parse branch operating hours into minutes from midnight
    const [openH, openM] = branchHour.openTime.split(":").map(Number);
    const [closeH, closeM] = branchHour.closeTime.split(":").map(Number);
    const branchOpenMinutes = openH * 60 + openM;
    let branchCloseMinutes = closeH * 60 + closeM;
    if (branchHour.closesNextDay || branchCloseMinutes <= branchOpenMinutes) {
      branchCloseMinutes += 24 * 60;
    }

    // STEP C: Determine Target Specialists & Qualification Check
    let eligibleSpecialists: Array<{ id: string; name: string }> = [];

    if (employeeId && employeeId !== "any") {
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

      // Check qualification: if specialist has assigned services, they MUST have isQualified: true
      const totalServices = await prisma.employeeService.count({
        where: { employeeId: emp.id },
      });
      if (totalServices > 0 && emp.services.length === 0) {
        return {
          date,
          branchId,
          serviceId: service.id,
          serviceDuration: duration,
          turnaroundBuffer: turnaround,
          availableSlots: [],
          slots: [],
        };
      }

      eligibleSpecialists = [{ id: emp.id, name: `${emp.firstName} ${emp.lastName}` }];
    } else {
      // Find all qualified specialists at this branch
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
        include: {
          employee: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      if (serviceEmployees.length > 0) {
        eligibleSpecialists = serviceEmployees.map((se) => ({
          id: se.employee.id,
          name: `${se.employee.firstName} ${se.employee.lastName}`,
        }));
      } else {
        // Fallback: If no specialist has strict service qualification mapping yet, allow active branch staff
        const branchEmployees = await prisma.employee.findMany({
          where: { branchId, status: true, isActive: true },
          select: { id: true, firstName: true, lastName: true },
        });
        eligibleSpecialists = branchEmployees.map((e) => ({
          id: e.id,
          name: `${e.firstName} ${e.lastName}`,
        }));
      }
    }

    if (eligibleSpecialists.length === 0) {
      return {
        date,
        branchId,
        serviceId: service.id,
        serviceDuration: duration,
        turnaroundBuffer: turnaround,
        availableSlots: [],
        slots: [],
      };
    }

    // STEP D: Same-Day Past Time Filtering Threshold
    const addisTime = this.getAddisAbabaCurrentTime(timeZone);
    const isToday = addisTime.dateStr === date;
    const pastMinutesThreshold = isToday ? addisTime.minutesFromMidnight + bufferMinutes : -1;

    // STEP E: Calculate Slots Per Specialist
    const startOfDayUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDayUTC = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    // Map: slotMinute -> Set of employeeIds available
    const slotMap = new Map<number, Set<string>>();

    for (const spec of eligibleSpecialists) {
      // 1. Shift check & schedule exception
      const effectiveSchedule = await EmployeeService.getEffectiveScheduleForDate(spec.id, date);

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

      // Bound specialist shift within branch hours
      const effectiveStart = Math.max(branchOpenMinutes, shiftStartMinutes);
      const effectiveEnd = Math.min(branchCloseMinutes, shiftEndMinutes);

      // 2. Fetch existing bookings for this specialist
      const existingBookings = await prisma.bookingItem.findMany({
        where: {
          employeeId: spec.id,
          startTime: { gte: startOfDayUTC, lte: endOfDayUTC },
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

      // Convert booked ranges into local minutes from midnight in Addis Ababa (UTC+3)
      const bookedRanges = existingBookings.map((b) => {
        // Convert Date to UTC+3 minutes from midnight
        const utcEpoch = b.startTime.getTime();
        const addisEpoch = utcEpoch + 3 * 3600 * 1000;
        const addisStartDate = new Date(addisEpoch);

        const utcEndEpoch = b.endTime.getTime();
        const addisEndEpoch = utcEndEpoch + 3 * 3600 * 1000;
        const addisEndDate = new Date(addisEndEpoch);

        const startMin = addisStartDate.getUTCHours() * 60 + addisStartDate.getUTCMinutes();
        const endMin = addisEndDate.getUTCHours() * 60 + addisEndDate.getUTCMinutes();

        return {
          start: startMin,
          end: endMin + turnaround, // include turnaround buffer
        };
      });

      // 3. Evaluate candidate slot starts
      for (let cur = effectiveStart; cur + duration <= effectiveEnd; cur += slotStepMinutes) {
        const curEnd = cur + duration;
        const curEndWithBuffer = cur + totalSlotBlock;

        // Skip if same-day and slot starts before current time + buffer
        if (isToday && cur <= pastMinutesThreshold) {
          continue;
        }

        // Skip if overlaps specialist break
        if (breakStartMinutes !== null && breakEndMinutes !== null) {
          if (cur < breakEndMinutes && curEnd > breakStartMinutes) {
            continue;
          }
        }

        // Check collision with existing bookings
        const hasCollision = bookedRanges.some((range) => {
          return cur < range.end && curEndWithBuffer > range.start;
        });

        if (!hasCollision) {
          if (!slotMap.has(cur)) {
            slotMap.set(cur, new Set());
          }
          slotMap.get(cur)!.add(spec.id);
        }
      }
    }

    // STEP F: Discretization & Formatting
    const sortedMinutes = Array.from(slotMap.keys()).sort((a, b) => a - b);
    const availableSlots: string[] = [];
    const detailedSlots: DetailedSlot[] = [];

    for (const min of sortedMinutes) {
      const hh = String(Math.floor(min / 60)).padStart(2, "0");
      const mm = String(min % 60).padStart(2, "0");
      const timeStr = `${hh}:${mm}`;

      // Construct ISO strings for UTC: Addis is UTC+3, so UTC hour = min/60 - 3
      const utcStartEpoch = Date.UTC(year, month - 1, day, Math.floor(min / 60) - 3, min % 60, 0, 0);
      const utcEndEpoch = utcStartEpoch + duration * 60 * 1000;

      const startTimeISO = new Date(utcStartEpoch).toISOString();
      const endTimeISO = new Date(utcEndEpoch).toISOString();

      availableSlots.push(timeStr);
      detailedSlots.push({
        time: timeStr,
        startTime: startTimeISO,
        endTime: endTimeISO,
        availableEmployeeIds: Array.from(slotMap.get(min)!),
      });
    }

    return {
      date,
      branchId,
      serviceId: service.id,
      serviceDuration: duration,
      turnaroundBuffer: turnaround,
      availableSlots,
      slots: detailedSlots,
    };
  }
}

