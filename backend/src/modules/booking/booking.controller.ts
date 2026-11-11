import { Request, Response, NextFunction } from "express";
import { BookingService } from "./booking.service";
import {
  availabilityQuerySchema,
  createBookingSchema,
  multiServiceAvailabilitySchema,
  cancelBookingSchema,
  rescheduleBookingSchema,
  updateAppointmentStatusSchema,
  staffExceptionSchema,
  createReviewSchema,
} from "./booking.schema";
import { BookingStatus } from "@prisma/client";

export class BookingController {
  static async getAvailableSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const query = availabilityQuerySchema.parse({
        branchId: req.query.branchId,
        serviceId: req.query.serviceId,
        employeeId: req.query.employeeId || undefined,
        date: req.query.date,
        timeZone: req.query.timeZone,
      });

      const slots = await BookingService.getAvailableSlots(query);
      res.status(200).json({ status: "success", data: slots });
    } catch (error) {
      next(error);
    }
  }

  static async getMultiServiceAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const payload =
        req.method === "POST"
          ? req.body
          : {
              branchId: req.query.branchId,
              date: req.query.date,
              services:
                typeof req.query.serviceIds === "string"
                  ? req.query.serviceIds.split(",").map((s: string) => ({ serviceId: s.trim() }))
                  : [],
              requireSameSpecialist: req.query.requireSameSpecialist === "true",
              timeZone: req.query.timeZone,
            };
      const input = multiServiceAvailabilitySchema.parse(payload);
      const result = await BookingService.getMultiServiceSlots(input);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async createBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createBookingSchema.parse(req.body);
      const booking = await BookingService.createBooking(input, req.user!);
      res.status(201).json({ status: "success", data: { booking } });
    } catch (error) {
      next(error);
    }
  }

  static async getMyBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const filter = (req.query.status as string) || "ALL";
      const bookings = await BookingService.getMyBookings(req.user!, filter);
      res.status(200).json({ status: "success", data: { bookings } });
    } catch (error) {
      next(error);
    }
  }

  static async getBookingByIdOrRef(req: Request, res: Response, next: NextFunction) {
    try {
      const idOrRef = req.params.idOrRef as string;
      const booking = await BookingService.getBookingByIdOrRef(idOrRef, req.user!);
      res.status(200).json({ status: "success", data: { booking } });
    } catch (error) {
      next(error);
    }
  }

  static async cancelBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { reason } = cancelBookingSchema.parse(req.body);
      const booking = await BookingService.cancelBooking(id, reason, req.user!);
      res.status(200).json({ status: "success", data: { booking } });
    } catch (error) {
      next(error);
    }
  }

  static async rescheduleBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const input = rescheduleBookingSchema.parse(req.body);
      const booking = await BookingService.rescheduleBooking(id, input, req.user!);
      res.status(200).json({ status: "success", data: { booking } });
    } catch (error) {
      next(error);
    }
  }

  static async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const itemId = req.params.itemId as string;
      const input = createReviewSchema.parse(req.body);
      const review = await BookingService.createReview(itemId, input, req.user!);
      res.status(201).json({ status: "success", data: { review } });
    } catch (error) {
      next(error);
    }
  }

  static async getStaffAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      const date = req.query.date as string | undefined;
      const status = req.query.status as string | undefined;
      const appointments = await BookingService.getStaffAppointments(req.user!, date, status);
      res.status(200).json({ status: "success", data: { appointments } });
    } catch (error) {
      next(error);
    }
  }

  static async acceptStaffAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const booking = await BookingService.updateAppointmentStatus(
        id,
        BookingStatus.CONFIRMED,
        undefined,
        req.user!
      );
      res.status(200).json({ status: "success", data: { booking } });
    } catch (error) {
      next(error);
    }
  }

  static async rejectStaffAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;
      const booking = await BookingService.updateAppointmentStatus(
        id,
        BookingStatus.REJECTED,
        reason,
        req.user!
      );
      res.status(200).json({ status: "success", data: { booking } });
    } catch (error) {
      next(error);
    }
  }

  static async updateStaffAppointmentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status, reason } = updateAppointmentStatusSchema.parse(req.body);
      const booking = await BookingService.updateAppointmentStatus(
        id,
        status as BookingStatus,
        reason,
        req.user!
      );
      res.status(200).json({ status: "success", data: { booking } });
    } catch (error) {
      next(error);
    }
  }

  static async getStaffAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.query.employeeId as string | undefined;
      const availability = await BookingService.getStaffAvailability(req.user!, employeeId);
      res.status(200).json({ status: "success", data: { availability } });
    } catch (error) {
      next(error);
    }
  }

  static async toggleStaffException(req: Request, res: Response, next: NextFunction) {
    try {
      const input = staffExceptionSchema.parse(req.body);
      const employeeId = req.query.employeeId as string | undefined;
      const exception = await BookingService.toggleStaffException(input, req.user!, employeeId);
      res.status(201).json({ status: "success", data: { exception } });
    } catch (error) {
      next(error);
    }
  }

  static async getAdminAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BookingService.getAdminAppointments(req.user!, {
        branchId: req.query.branchId as string | undefined,
        date: req.query.date as string | undefined,
        status: req.query.status as string | undefined,
        specialistId: req.query.specialistId as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  static async transitionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const targetStatus = (req.body.targetStatus || req.body.status) as string;
      const reason = req.body.cancellationReason || req.body.reason;
      const booking = await BookingService.transitionBookingStatus(
        id,
        targetStatus,
        req.user!,
        reason
      );
      res.status(200).json({ status: "success", success: true, data: { booking } });
    } catch (error) {
      next(error);
    }
  }

  static async updateAdminAppointmentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status, reason } = updateAppointmentStatusSchema.parse(req.body);
      const booking = await BookingService.updateAppointmentStatus(
        id,
        status as BookingStatus,
        reason,
        req.user!
      );
      res.status(200).json({ status: "success", data: { booking } });
    } catch (error) {
      next(error);
    }
  }

  static async getIncomeReport(req: Request, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as "DAILY" | "MONTHLY") || "MONTHLY";
      const branchId = req.query.branchId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const report = await BookingService.getIncomeReport(
        req.user!,
        period,
        branchId,
        startDate,
        endDate
      );
      res.status(200).json({ status: "success", data: { report } });
    } catch (error) {
      next(error);
    }
  }
}
