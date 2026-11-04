import { Request, Response, NextFunction } from "express";
import { ServiceRitualService } from "./service.service";
import {
  createServiceSchema,
  updateServiceSchema,
  updateBranchServiceRuleSchema,
} from "./service.schema";
import { UnauthorizedError } from "../../errors/AppError";

export class ServiceController {
  static async listServices(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { search, category, branchId, status } = req.query;

      const services = await ServiceRitualService.listServices(
        {
          search: search as string | undefined,
          category: category as string | undefined,
          branchId: branchId as string | undefined,
          status: status as string | undefined,
        },
        req.user
      );

      res.status(200).json({
        success: true,
        count: services.length,
        data: services,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getServiceById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const branchId = req.query.branchId as string | undefined;
      const service = await ServiceRitualService.getServiceById(
        req.params.id as string,
        req.user,
        branchId
      );

      res.status(200).json({
        success: true,
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createService(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const data = createServiceSchema.parse(req.body);
      const service = await ServiceRitualService.createService(data, req.user);

      res.status(201).json({
        success: true,
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateService(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const data = updateServiceSchema.parse(req.body);
      const service = await ServiceRitualService.updateService(
        req.params.id as string,
        data,
        req.user
      );

      res.status(200).json({
        success: true,
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateBranchRules(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { id, branchId } = req.params;
      const data = updateBranchServiceRuleSchema.parse(req.body);

      const rule = await ServiceRitualService.updateBranchRules(
        id as string,
        branchId as string,
        data,
        req.user
      );

      res.status(200).json({
        success: true,
        data: rule,
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleServiceStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await ServiceRitualService.toggleServiceStatus(
        req.params.id as string,
        req.user
      );

      res.status(200).json({
        success: true,
        data: result.service,
        warning: result.warning,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBranchGovernance(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const branchIdOrSlug =
        (req.params.branchId as string) ||
        (typeof req.query.branchId === "string" ? req.query.branchId : "bole-bulbula");

      const governance = await ServiceRitualService.getBranchGovernance(
        branchIdOrSlug,
        req.user
      );

      res.status(200).json({
        success: true,
        data: governance,
      });
    } catch (error) {
      next(error);
    }
  }
}
