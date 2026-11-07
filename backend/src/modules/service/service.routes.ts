import { Router } from "express";
import { ServiceController } from "./service.controller";
import { authenticate, optionalAuthenticate, authorize, requireBranchAccess, requirePermission } from "../../middleware/auth";

const router = Router();

// 1. Branch Governance metrics (Placed before /:id) - Strictly restricted to OWNER / Scoped BRANCH_ADMIN
router.get("/governance/:branchId", authenticate, authorize("OWNER", "BRANCH_ADMIN"), requireBranchAccess, ServiceController.getBranchGovernance);

// 2. Master Catalog Listing & Dynamic Categories (Public / Guests / Authenticated)
router.get("/categories", optionalAuthenticate, ServiceController.getCategories);
router.get("/", optionalAuthenticate, ServiceController.listServices);
router.get("/:id", optionalAuthenticate, ServiceController.getServiceById);

// 3. Master Ritual Curation & Mutations (OWNER Only)
router.post("/", authenticate, authorize("OWNER"), ServiceController.createService);
router.patch("/:id", authenticate, authorize("OWNER"), ServiceController.updateService);
router.patch("/:id/toggle-status", authenticate, authorize("OWNER"), ServiceController.toggleServiceStatus);

// 4. Branch Pricing & Local Rule Overrides (OWNER or Scoped BRANCH_ADMIN with manage_prices)
router.put("/:id/branches/:branchId", authenticate, authorize("OWNER", "BRANCH_ADMIN"), requireBranchAccess, requirePermission("manage_prices"), ServiceController.updateBranchRules);

export default router;

