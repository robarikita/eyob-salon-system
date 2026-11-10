import prisma from "../../utils/prisma";
import { BookingStatus, BranchHours } from "@prisma/client";
import { NotFoundError, ValidationError } from "../../errors/AppError";
import { ServiceRitualService } from "../service/service.service";
import { EmployeeService } from "../employee/employee.service";
import { AvailabilityService } from "./availability.service";

export interface MultiServiceItemRequest {
  serviceId: string;
  preferredEmployeeId?: string | null;
}

export interface MultiServiceChainParams {
  branchId: string;
  date: string; // "YYYY-MM-DD"
  services: MultiServiceItemRequest[];
  requireSameSpecialist?: boolean;
  timeZone?: string;
  bufferMinutes?: number;
}

export interface ChainStep {
  serviceId: string;
  serviceName: string;
  serviceNameAm?: string | null;
  startTime: string; // "10:00"
  endTime: string; // "11:30"
  startTimeISO: string;
  endTimeISO: string;
  durationMinutes: number;
  employeeId: string;
  employeeName: string;
}

export interface MultiServiceChainOption {
  chainStartTime: string; // "10:00"
  chainEndTime: string; // "12:30"
  chainStartTimeISO: string;
  chainEndTimeISO: string;
  totalDurationMinutes: number;
  steps: ChainStep[];
}

export class MultiServiceSchedulingService {
  /**
   * Calculate sequential multi-service chain slots with dynamic specialist allocation
   */
  static async calculateMultiServiceChainSlots(params: MultiServiceChainParams): Promise<{
    date: string;
    branchId: string;
    totalDurationMinutes: number;
    chainOptions: MultiServiceChainOption[];
  }> {
    const {
      branchId,
      date,
      services: requestedServices,
      requireSameSpecialist = false,
      timeZone = "Africa/Addis_Ababa",
      bufferMinutes = 15,
    } = params;

    if (!requestedServices || requestedServices.length === 0) {
      throw new ValidationError("At least one service is required for multi-service scheduling.");
    }

    // 1. Fetch branch & hours
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
        totalDurationMinutes: 0,
        chainOptions: [],
      };
    }

    const [openH, openM] = branchHour.openTime.split(":").map(Number);
    const [closeH, closeM] = branchHour.closeTime.split(":").map(Number);
    const branchOpenMinutes = openH * 60 + openM;
    let branchCloseMinutes = closeH * 60 + closeM;
    if (branchHour.closesNextDay || branchCloseMinutes <= branchOpenMinutes) {
      branchCloseMinutes += 24 * 60;
    }

    // 2. Resolve all services in the sequence
    const dummyUser = { id: "system", role: "CUSTOMER" as any, branchId: null };
    const resolvedServices: Array<{
      id: string;
      name: string;
      nameAm?: string | null;
      duration: number;
      turnaround: number;
      preferredEmployeeId?: string | null;
    }> = [];

    let totalDuration = 0;
    for (const req of requestedServices) {
      const srv = await ServiceRitualService.getServiceById(req.serviceId, dummyUser, branchId);
      if (!srv.isActive) {
        throw new ValidationError(`Service '${srv.name}' is inactive.`);
      }
      const dur = srv.effectiveDuration || 60;
      const turn = srv.effectiveTurnaround || 15;
      totalDuration += dur;
      resolvedServices.push({
        id: srv.id,
        name: srv.name,
        nameAm: srv.nameAm,
        duration: dur,
        turnaround: turn,
        preferredEmployeeId: req.preferredEmployeeId || null,
      });
    }

    // 3. Same-day past time filter threshold
    const addisTime = AvailabilityService.getAddisAbabaCurrentTime(timeZone);
    const isToday = addisTime.dateStr === date;
    const pastMinutesThreshold = isToday ? addisTime.minutesFromMidnight + bufferMinutes : -1;

    // 4. Fetch all active specialists in branch and their schedules
    const startOfDayUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDayUTC = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const branchSpecialists = await prisma.employee.findMany({
      where: { branchId, status: 'ACTIVE', isActive: true },
      include: {
        services: { where: { isQualified: true } },
      },
    });

    if (branchSpecialists.length === 0) {
      return {
        date,
        branchId,
        totalDurationMinutes: totalDuration,
        chainOptions: [],
      };
    }

    // Preload schedules, exceptions, and bookings for all specialists
    const specialistProfiles = new Map<
      string,
      {
        id: string;
        name: string;
        qualifiedServiceIds: Set<string>;
        shiftStart: number;
        shiftEnd: number;
        breakStart: number | null;
        breakEnd: number | null;
        isWorking: boolean;
        bookedRanges: Array<{ start: number; end: number }>;
      }
    >();

    for (const emp of branchSpecialists) {
      const sched = await EmployeeService.getEffectiveScheduleForDate(emp.id, date);
      if (!sched.isWorking || !sched.startTime || !sched.endTime) {
        continue;
      }

      const [sH, sM] = sched.startTime.split(":").map(Number);
      const [eH, eM] = sched.endTime.split(":").map(Number);
      const shiftStart = Math.max(branchOpenMinutes, sH * 60 + sM);
      let shiftEnd = eH * 60 + eM;
      if (branchHour.closesNextDay && shiftEnd <= shiftStart) {
        shiftEnd += 24 * 60;
      }
      shiftEnd = Math.min(branchCloseMinutes, shiftEnd);

      let breakStart: number | null = null;
      let breakEnd: number | null = null;
      if (sched.breakStartTime && sched.breakEndTime) {
        const [bsh, bsm] = sched.breakStartTime.split(":").map(Number);
        const [beh, bem] = sched.breakEndTime.split(":").map(Number);
        breakStart = bsh * 60 + bsm;
        breakEnd = beh * 60 + bem;
      }

      const existingBookings = await prisma.bookingItem.findMany({
        where: {
          employeeId: emp.id,
          startTime: { gte: startOfDayUTC, lte: endOfDayUTC },
          booking: {
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.PENDING_PAYMENT] },
            OR: [
              { status: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] } },
              { status: BookingStatus.PENDING_PAYMENT, reservationExpires: { gt: new Date() } },
            ],
          },
        },
      });

      const bookedRanges = existingBookings.map((b) => {
        const addisStart = new Date(b.startTime.getTime() + 3 * 3600 * 1000);
        const addisEnd = new Date(b.endTime.getTime() + 3 * 3600 * 1000);
        const startMin = addisStart.getUTCHours() * 60 + addisStart.getUTCMinutes();
        const endMin = addisEnd.getUTCHours() * 60 + addisEnd.getUTCMinutes();
        return { start: startMin, end: endMin };
      });

      const qualifiedSet = new Set(emp.services.map((s) => s.serviceId));

      specialistProfiles.set(emp.id, {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        qualifiedServiceIds: qualifiedSet,
        shiftStart,
        shiftEnd,
        breakStart,
        breakEnd,
        isWorking: true,
        bookedRanges,
      });
    }

    // 5. Evaluate chain candidate start times along branch grid
    const slotStep = branch.slotBufferMinutes || 15;
    const chainOptions: MultiServiceChainOption[] = [];

    // Helper to test if a specialist is free during window [startMin, endMin]
    const isSpecialistFree = (
      profile: NonNullable<ReturnType<typeof specialistProfiles.get>>,
      serviceId: string,
      startMin: number,
      endMin: number,
      turnaround: number,
      reservedWindows: Array<{ employeeId: string; start: number; end: number }>
    ) => {
      // 1. Qualification check: if specialist has assigned services, must be qualified
      if (profile.qualifiedServiceIds.size > 0 && !profile.qualifiedServiceIds.has(serviceId)) {
        return false;
      }

      // 2. Shift bounds
      if (startMin < profile.shiftStart || endMin > profile.shiftEnd) {
        return false;
      }

      // 3. Break overlap
      if (profile.breakStart !== null && profile.breakEnd !== null) {
        if (startMin < profile.breakEnd && endMin > profile.breakStart) {
          return false;
        }
      }

      // 4. Existing bookings collision
      const windowWithBuffer = endMin + turnaround;
      for (const b of profile.bookedRanges) {
        if (startMin < (b.end + turnaround) && windowWithBuffer > b.start) {
          return false;
        }
      }

      // 5. Collision with previous steps in this very chain (direct time overlap)
      for (const res of reservedWindows) {
        if (res.employeeId === profile.id) {
          if (startMin < res.end && endMin > res.start) {
            return false;
          }
        }
      }

      return true;
    };

    for (let candidateStart = branchOpenMinutes; candidateStart + totalDuration <= branchCloseMinutes; candidateStart += slotStep) {
      if (isToday && candidateStart <= pastMinutesThreshold) {
        continue;
      }

      let currentStepStart = candidateStart;
      let chainFeasible = true;
      const steps: ChainStep[] = [];
      const chainReservations: Array<{ employeeId: string; start: number; end: number }> = [];
      let fixedSpecialistId: string | null = null;

      for (const srv of resolvedServices) {
        const stepEnd = currentStepStart + srv.duration;

        // Determine candidate specialists for this step
        let candidates: string[] = [];
        if (requireSameSpecialist && fixedSpecialistId) {
          candidates = [fixedSpecialistId];
        } else if (srv.preferredEmployeeId) {
          candidates = [srv.preferredEmployeeId];
        } else {
          candidates = Array.from(specialistProfiles.keys());
        }

        let selectedCandidate: NonNullable<ReturnType<typeof specialistProfiles.get>> | null = null;

        for (const candId of candidates) {
          const profile = specialistProfiles.get(candId);
          if (!profile) continue;

          if (isSpecialistFree(profile, srv.id, currentStepStart, stepEnd, srv.turnaround, chainReservations)) {
            selectedCandidate = profile;
            break;
          }
        }

        if (!selectedCandidate) {
          chainFeasible = false;
          break;
        }

        if (requireSameSpecialist && !fixedSpecialistId) {
          fixedSpecialistId = selectedCandidate.id;
        }

        const startHH = String(Math.floor(currentStepStart / 60)).padStart(2, "0");
        const startMM = String(currentStepStart % 60).padStart(2, "0");
        const endHH = String(Math.floor(stepEnd / 60)).padStart(2, "0");
        const endMM = String(stepEnd % 60).padStart(2, "0");

        const utcStartEpoch = Date.UTC(year, month - 1, day, Math.floor(currentStepStart / 60) - 3, currentStepStart % 60, 0, 0);
        const utcEndEpoch = Date.UTC(year, month - 1, day, Math.floor(stepEnd / 60) - 3, stepEnd % 60, 0, 0);

        steps.push({
          serviceId: srv.id,
          serviceName: srv.name,
          serviceNameAm: srv.nameAm,
          startTime: `${startHH}:${startMM}`,
          endTime: `${endHH}:${endMM}`,
          startTimeISO: new Date(utcStartEpoch).toISOString(),
          endTimeISO: new Date(utcEndEpoch).toISOString(),
          durationMinutes: srv.duration,
          employeeId: selectedCandidate.id,
          employeeName: selectedCandidate.name,
        });

        chainReservations.push({
          employeeId: selectedCandidate.id,
          start: currentStepStart,
          end: stepEnd,
        });

        currentStepStart = stepEnd;
      }

      if (chainFeasible && steps.length === resolvedServices.length) {
        const chainStartHH = String(Math.floor(candidateStart / 60)).padStart(2, "0");
        const chainStartMM = String(candidateStart % 60).padStart(2, "0");
        const chainEndHH = String(Math.floor(currentStepStart / 60)).padStart(2, "0");
        const chainEndMM = String(currentStepStart % 60).padStart(2, "0");

        const chainUtcStart = Date.UTC(year, month - 1, day, Math.floor(candidateStart / 60) - 3, candidateStart % 60, 0, 0);
        const chainUtcEnd = Date.UTC(year, month - 1, day, Math.floor(currentStepStart / 60) - 3, currentStepStart % 60, 0, 0);

        chainOptions.push({
          chainStartTime: `${chainStartHH}:${chainStartMM}`,
          chainEndTime: `${chainEndHH}:${chainEndMM}`,
          chainStartTimeISO: new Date(chainUtcStart).toISOString(),
          chainEndTimeISO: new Date(chainUtcEnd).toISOString(),
          totalDurationMinutes: totalDuration,
          steps,
        });
      }
    }

    return {
      date,
      branchId,
      totalDurationMinutes: totalDuration,
      chainOptions,
    };
  }
}

