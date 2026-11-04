import { Request, Response, NextFunction } from "express";
import { EmployeeService } from "./employee.service";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  assignServicesSchema,
  setEmployeeScheduleSchema,
  createExceptionSchema,
} from "./employee.schema";
import { UnauthorizedError } from "../../errors/AppError";

export class EmployeeController {
  static async createEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const data = createEmployeeSchema.parse(req.body);
      const employee = await EmployeeService.createEmployee(data, req.user);
      res.status(201).json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }

  static async getAllEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { branchId, status, search, ritualCategory } = req.query;
      const employees = await EmployeeService.getEmployees(
        {
          branchId: branchId as string | undefined,
          status: status !== undefined ? status === "true" || status === "1" : undefined,
          search: search as string | undefined,
          ritualCategory: ritualCategory as string | undefined,
        },
        req.user
      );
      res.status(200).json({ success: true, count: employees.length, data: employees });
    } catch (error) {
      next(error);
    }
  }

  static async getEmployeeById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const employee = await EmployeeService.getEmployeeById(req.params.id as string, req.user);
      res.status(200).json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }

  static async updateEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const data = updateEmployeeSchema.parse(req.body);
      const employee = await EmployeeService.updateEmployee(req.params.id as string, data, req.user);
      res.status(200).json({ success: true, data: employee });
    } catch (error) {
      next(error);
    }
  }

  static async toggleEmployeeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await EmployeeService.toggleEmployeeStatus(req.params.id as string, req.user);
      res.status(200).json({
        success: true,
        data: result.employee,
        warning: result.warning,
      });
    } catch (error) {
      next(error);
    }
  }

  static async assignServices(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const data = assignServicesSchema.parse(req.body);
      const assigned = await EmployeeService.assignServices(req.params.id as string, data, req.user);
      res.status(200).json({ success: true, data: assigned });
    } catch (error) {
      next(error);
    }
  }

  static async setSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const data = setEmployeeScheduleSchema.parse(req.body);
      const schedules = await EmployeeService.setSchedule(req.params.id as string, data, req.user);
      res.status(200).json({ success: true, data: schedules });
    } catch (error) {
      next(error);
    }
  }

  static async createException(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const data = createExceptionSchema.parse(req.body);
      const exception = await EmployeeService.createException(req.params.id as string, data, req.user);
      res.status(201).json({ success: true, data: exception });
    } catch (error) {
      next(error);
    }
  }

  static async getDashboardMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const branchId = req.query.branchId as string | undefined;
      const metrics = await EmployeeService.getDashboardMetrics(req.user, branchId);
      res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }
}

