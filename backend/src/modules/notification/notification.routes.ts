import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", NotificationController.listNotifications);
router.patch("/read-all", NotificationController.markAllAsRead);
router.patch("/:id/read", NotificationController.markAsRead);
router.delete("/:id", NotificationController.deleteNotification);
router.delete("/", NotificationController.deleteAllNotifications);

export default router;

