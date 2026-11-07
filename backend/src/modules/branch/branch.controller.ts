import { Request, Response, NextFunction } from "express";
import { BranchService } from "./branch.service";
import {
  createBranchSchema,
  updateBranchSchema,
  assignAdminSchema,
  updateBusinessHoursSchema,
} from "./branch.schema";

export class BranchController {
  static async createBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createBranchSchema.parse(req.body);
      const branch = await BranchService.createBranch(data);
      res.status(201).json({ success: true, data: branch });
    } catch (error) {
      next(error);
    }
  }

  static async getAllBranches(req: Request, res: Response, next: NextFunction) {
    try {
      const branches = await BranchService.getAllBranches(req.user?.role);
      res.status(200).json({ success: true, data: branches });
    } catch (error) {
      next(error);
    }
  }

  static async getBranchById(req: Request, res: Response, next: NextFunction) {
    try {
      const branch = await BranchService.getBranchById(req.params.id as string);
      res.status(200).json({ success: true, data: branch });
    } catch (error) {
      next(error);
    }
  }

  static async updateBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateBranchSchema.parse(req.body);
      const branch = await BranchService.updateBranch(req.params.id as string, data);
      res.status(200).json({ success: true, data: branch });
    } catch (error) {
      next(error);
    }
  }

  static async deleteBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BranchService.deleteBranch(req.params.id as string);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async permanentDeleteBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BranchService.permanentDeleteBranch(req.params.id as string);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async toggleBranchStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const isActive = typeof req.body?.isActive === "boolean" ? req.body.isActive : undefined;
      const branch = await BranchService.toggleBranchStatus(req.params.id as string, isActive);
      res.status(200).json({ success: true, data: branch });
    } catch (error) {
      next(error);
    }
  }

  static async assignBranchAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const data = assignAdminSchema.parse(req.body);
      const updatedUser = await BranchService.assignBranchAdmin(req.params.id as string, data.userId);
      res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
      next(error);
    }
  }

  static async getBranchHours(req: Request, res: Response, next: NextFunction) {
    try {
      const hours = await BranchService.getBranchHours(req.params.id as string);
      res.status(200).json({ success: true, data: hours });
    } catch (error) {
      next(error);
    }
  }

  static async setBranchHours(req: Request, res: Response, next: NextFunction) {
    try {
      const hours = updateBusinessHoursSchema.parse(req.body);
      const branchHours = await BranchService.setBranchHours(req.params.id as string, hours);
      res.status(200).json({ success: true, data: branchHours });
    } catch (error) {
      next(error);
    }
  }
}
