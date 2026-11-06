import { Router } from "express";
import { AdminController } from "./admin.controller";
import { authenticate, authorize, requirePermission } from "../../middleware/auth";

const router = Router();

router.use(authenticate);

// 1. Audit Logs (Requires view_audit_logs; OWNER passes automatically)
router.get("/audit-logs", requirePermission("view_audit_logs"), AdminController.getAuditLogs);

// 2. Roles & Permissions Query (OWNER & BRANCH_ADMIN)
router.get("/roles", authorize("OWNER", "BRANCH_ADMIN"), AdminController.getRoles);
router.get("/permissions", authorize("OWNER", "BRANCH_ADMIN"), AdminController.getPermissions);
router.get("/branch-admins", authorize("OWNER", "BRANCH_ADMIN"), AdminController.getBranchAdmins);

// 3. Role Mutations (OWNER Only)
router.post("/roles", authorize("OWNER"), AdminController.createRole);
router.patch("/roles/:id/permissions", authorize("OWNER"), AdminController.updateRolePermissions);
router.post("/users/:id/reset-password", authorize("OWNER"), AdminController.resetUserPassword);

export default router;

