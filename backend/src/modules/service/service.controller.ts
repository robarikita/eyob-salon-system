import { Request, Response, NextFunction } from "express";
import { ServiceRitualService } from "./service.service";
import {
  createServiceSchema,
  updateServiceSchema,
  branchPriceOverrideSchema,
  createCategorySchema,
  depositRuleSchema,
  updateBranchServiceRuleSchema,
} from "./service.schema";
import { UnauthorizedError } from "../../errors/AppError";
import { uploadImage } from "../../utils/cloudinary";

export class ServiceController {
  static async listServices(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, category, branchId, status, isActive } = req.query;
      let effectiveStatus = status as string | undefined;
      if (!effectiveStatus && isActive !== undefined) {
        effectiveStatus = String(isActive) === "true" ? "active" : "inactive";
      }

      const services = await ServiceRitualService.listServices(
        {
          search: search as string | undefined,
          category: category as string | undefined,
          branchId: branchId as string | undefined,
          status: effectiveStatus,
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

  static async setBranchPrice(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const serviceId = req.params.id as string;
      const data = branchPriceOverrideSchema.parse(req.body);
      const result = await ServiceRitualService.setBranchPrice(serviceId, data, req.user);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPriceHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const serviceId = req.params.id as string;
      const branchId = req.query.branchId as string | undefined;
      const history = await ServiceRitualService.getPriceHistory(serviceId, branchId);

      res.status(200).json({
        success: true,
        count: history.length,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  static async setBranchDepositRule(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const branchId = req.params.id as string;
      const data = depositRuleSchema.parse(req.body);
      const result = await ServiceRitualService.setBranchDepositRule(branchId, data, req.user);

      res.status(200).json({
        success: true,
        data: result,
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

  static async uploadServiceImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      let input: string | Buffer;

      if ((req as any).file) {
        input = (req as any).file.buffer;
      } else if (req.body?.image) {
        input = req.body.image;
      } else {
        res.status(400).json({ success: false, message: "No image file or base64 image provided." });
        return;
      }

      const result = await uploadImage(input);
      res.status(200).json({
        success: true,
        data: result,
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

  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
      const categories = await ServiceRitualService.getCategories(branchId, req.user);
      res.status(200).json({
        success: true,
        count: categories.length,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const data = createCategorySchema.parse(req.body);
      const category = await ServiceRitualService.createCategory(data, req.user);
      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }
}
