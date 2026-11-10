import { Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import { NotFoundError, UnauthorizedError } from "../../errors/AppError";
import { BookingService } from "../booking/booking.service";

export class StaffController {
  /**
   * Helper to resolve the Employee record corresponding to the current user
   */
  private static async resolveEmployeeForUser(userId: string, email?: string | null, phone?: string | null) {
    let employee = await prisma.employee.findFirst({
      where: { userId },
      include: {
        branch: true,
        services: {
          where: { isQualified: true },
          include: { service: true },
        },
        schedules: {
          orderBy: { dayOfWeek: "asc" },
        },
        scheduleExceptions: {
          orderBy: { date: "asc" },
        },
      },
    });

    if (!employee && (email || phone)) {
      employee = await prisma.employee.findFirst({
        where: {
          OR: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : []),
          ],
        },
        include: {
          branch: true,
          services: {
            where: { isQualified: true },
            include: { service: true },
          },
          schedules: {
            orderBy: { dayOfWeek: "asc" },
          },
          scheduleExceptions: {
            orderBy: { date: "asc" },
          },
        },
      });
    }

    return employee;
  }

  /**
   * GET /api/v1/staff/me
   * Return authenticated employee's profile, branch, and qualified services
   */
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const employee = await StaffController.resolveEmployeeForUser(
        req.user.id,
        req.user.phoneNumber,
        req.user.phoneNumber
      );

      if (!employee) {
        throw new NotFoundError("Specialist profile not found for this user account.");
      }

      res.status(200).json({
        success: true,
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/staff/schedule
   * Return weekly schedule and confirmed exceptions for this specialist
   */
  static async getMySchedule(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const employee = await StaffController.resolveEmployeeForUser(
        req.user.id,
        req.user.phoneNumber,
        req.user.phoneNumber
      );

      if (!employee) {
        throw new NotFoundError("Specialist profile not found for this user account.");
      }

      res.status(200).json({
        success: true,
        data: {
          schedules: employee.schedules,
          exceptions: employee.scheduleExceptions,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/staff/appointments
   * Return appointments assigned to this specialist
   */
  static async getMyAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const date = req.query.date as string | undefined;
      const status = req.query.status as string | undefined;
      const appointments = await BookingService.getStaffAppointments(req.user, date, status);
      res.status(200).json({
        success: true,
        data: appointments,
        appointments, // Support both response shapes
      });
    } catch (error) {
      next(error);
    }
  }
}

