import { Router } from "express";
import { BranchController } from "./branch.controller";
import {
  authenticate,
  authorize,
  requireBranchAccess,
} from "../../middleware/auth";

const router = Router();

// Optional auth helper
const optionalAuth = (req: any, res: any, next: any) => {
  if (req.headers.authorization || req.cookies?.accessToken) {
    authenticate(req, res, next);
    return;
  }
  next();
};

// Public / Authenticated read routes
router.get("/", optionalAuth, BranchController.getAllBranches);
router.get("/:id", optionalAuth, BranchController.getBranchById);
router.get("/:id/hours", optionalAuth, BranchController.getBranchHours);

// Protected management routes (Owner Only)
router.post(
  "/",
  authenticate,
  authorize("OWNER"),
  BranchController.createBranch
);

router.patch(
  "/:id",
  authenticate,
  authorize("OWNER"),
  BranchController.updateBranch
);

router.delete(
  "/:id",
  authenticate,
  authorize("OWNER"),
  BranchController.deleteBranch
);

// Branch status toggle (Owner-only)
router.patch(
  "/:id/status",
  authenticate,
  authorize("OWNER"),
  BranchController.toggleBranchStatus
);

router.patch(
  "/:id/toggle-status",
  authenticate,
  authorize("OWNER"),
  BranchController.toggleBranchStatus
);

// Assign Branch Administrator (Owner-only)
router.post(
  "/:id/assign-admin",
  authenticate,
  authorize("OWNER"),
  BranchController.assignBranchAdmin
);

// Operating Hours configuration (Owner or assigned Branch Admin)
router.put(
  "/:id/hours",
  authenticate,
  authorize("OWNER", "BRANCH_ADMIN"),
  requireBranchAccess,
  BranchController.setBranchHours
);

export default router;
