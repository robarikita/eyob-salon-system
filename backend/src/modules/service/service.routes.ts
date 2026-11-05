import { Router } from "express";
import { ServiceController } from "./service.controller";
import { authenticate, authorize, requireBranchAccess, requirePermission } from "../../middleware/auth";

const router = Router();

// All service routes require authentication
router.use(authenticate);

// 1. Branch Governance metrics (Placed before /:id)
router.get("/governance/:branchId", authorize("OWNER", "BRANCH_ADMIN"), requireBranchAccess, ServiceController.getBranchGovernance);

// 2. Master Catalog Listing & Dynamic Categories (Categories before /:id)
router.get("/categories", ServiceController.getCategories);
router.get("/", ServiceController.listServices);
router.get("/:id", ServiceController.getServiceById);

// 3. Master Ritual Curation & Mutations (OWNER Only)
router.post("/", authorize("OWNER"), ServiceController.createService);
router.patch("/:id", authorize("OWNER"), ServiceController.updateService);
router.patch("/:id/toggle-status", authorize("OWNER"), ServiceController.toggleServiceStatus);

// 4. Branch Pricing & Local Rule Overrides (OWNER or Scoped BRANCH_ADMIN with manage_prices)
router.put("/:id/branches/:branchId", authorize("OWNER", "BRANCH_ADMIN"), requireBranchAccess, requirePermission("manage_prices"), ServiceController.updateBranchRules);

export default router;

