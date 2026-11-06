import { Request, Response, NextFunction } from "express";
import { CustomerService } from "./customer.service";
import { updateProfileSchema } from "./customer.schema";

export class CustomerController {
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
