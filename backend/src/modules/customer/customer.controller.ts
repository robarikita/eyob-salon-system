import { Request, Response, NextFunction } from "express";
import { CustomerService } from "./customer.service";
import { updateProfileSchema } from "./customer.schema";

export class CustomerController {
  static async listCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const branchId = req.query.branchId as string | undefined;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const result = await CustomerService.listCustomers(
        { search, branchId, page, limit },
        req.user!
      );

      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await CustomerService.getCustomerById(
        req.params.id as string,
        req.user!
      );
      res.status(200).json({
        status: "success",
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await CustomerService.getCustomerHistory(
        req.params.id as string,
        req.user!
      );
      res.status(200).json({
        status: "success",
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: "error", message: "Not authenticated" });
        return;
      }
      const profile = await CustomerService.getProfile(req.user.id);
      res.status(200).json({
        status: "success",
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: "error", message: "Not authenticated" });
        return;
      }
      const validated = updateProfileSchema.parse(req.body);
      const updated = await CustomerService.updateProfile(req.user.id, validated);
      res.status(200).json({
        status: "success",
        message: "Profile updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}

