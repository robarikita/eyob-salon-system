import { Request, Response, NextFunction } from "express";
import { NotificationService } from "./notification.service";
import { UnauthorizedError } from "../../errors/AppError";

export class NotificationController {
  static async listNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await NotificationService.listNotifications(req.user.id);

      res.status(200).json({
        success: true,
        count: result.notifications.length,
        unreadCount: result.unreadCount,
        data: result.notifications,
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const id = req.params.id as string;
      const updated = await NotificationService.markAsRead(id, req.user.id);

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      await NotificationService.markAllAsRead(req.user.id);

      res.status(200).json({
        success: true,
        message: "All notifications marked as read / ሁሉም ማሳወቂያዎች ተነበዋል",
      });
    } catch (error) {
      next(error);
    }
  }
}

