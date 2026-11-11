import { Router } from "express";
import { AdminController } from "./admin.controller";
import { authenticate, authorize, requirePermission } from "../../middleware/auth";

const router = Router();

router.use(authenticate);

// 1. Audit Logs (Requires view_audit_logs; OWNER passes automatically)
router.get("/audit-logs", requirePermission("view_audit_logs"), AdminController.getAuditLogs);

// 2. Roles & Permissions Query (Strictly OWNER Only)
router.get("/roles", authorize("OWNER"), AdminController.getRoles);
router.get("/permissions", authorize("OWNER"), AdminController.getPermissions);
router.get("/branch-admins", authorize("OWNER"), AdminController.getBranchAdmins);

// 3. Role Mutations (Strictly OWNER Only)
router.post("/roles", authorize("OWNER"), AdminController.createRole);
router.patch("/roles/:id/permissions", authorize("OWNER"), AdminController.updateRolePermissions);
router.patch("/branch-admins/:id/permissions", authorize("OWNER"), AdminController.updateAdminPermissions);
router.post("/users/:id/reset-password", authorize("OWNER"), AdminController.resetUserPassword);

// 4. Governance & Change Approvals
router.get("/governance", authorize("OWNER", "BRANCH_ADMIN"), AdminController.getGovernanceRequests);
router.post("/governance/:id/review", authorize("OWNER"), AdminController.reviewGovernanceRequest);
router.delete("/governance/:id", authorize("OWNER", "BRANCH_ADMIN"), AdminController.deleteGovernanceRequest);

export default router;

