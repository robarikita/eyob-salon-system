import { Router } from "express";
import { CustomerController } from "./customer.controller";
import { authenticate, authorize } from "../../middleware/auth";

const router = Router();

router.use(authenticate);

// Admin Clientele Directory (Owner & Branch Admin)
router.get("/", authorize("OWNER", "BRANCH_ADMIN"), CustomerController.listCustomers);

// Customer Self-Management
router.get("/me", CustomerController.getMe);
router.patch("/me", CustomerController.updateMe);

// Cross-Branch Dossier History (Owner & Branch Admin)
router.get("/:id/history", authorize("OWNER", "BRANCH_ADMIN"), CustomerController.getCustomerHistory);

// Single Profile Query (with Customer Isolation Guard)
router.get("/:id", CustomerController.getCustomerById);

export default router;

