import { Router } from "express";
import { BranchController } from "./branch.controller";
import { authenticate, authorize, requireBranchAccess } from "../../middleware/auth";

const router = Router();

// Public routes (Optionally authenticate to extract role if present)
const optionalAuth = (req: any, res: any, next: any) => {
  if (req.headers.authorization || req.cookies?.accessToken) {
    return authenticate(req, res, next);
  }
  next();
};

router.get("/", optionalAuth, BranchController.getAllBranches);
router.get("/:id", BranchController.getBranchById);

// Protected routes
router.post("/", authenticate, authorize("OWNER"), BranchController.createBranch);
router.patch("/:id", authenticate, authorize("OWNER", "BRANCH_ADMIN"), requireBranchAccess, BranchController.updateBranch);
router.put("/:id/hours", authenticate, authorize("OWNER", "BRANCH_ADMIN"), requireBranchAccess, BranchController.setBranchHours);
router.patch("/:id/toggle-status", authenticate, authorize("OWNER"), BranchController.toggleBranchStatus);

export default router;
