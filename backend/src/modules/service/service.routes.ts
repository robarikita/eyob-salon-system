import { Router } from "express";
import multer from "multer";
import { ServiceController } from "./service.controller";
import {
  authenticate,
  optionalAuthenticate,
  authorize,
  requireBranchAccess,
  requirePermission,
} from "../../middleware/auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = Router();

// 1. Branch Governance metrics (Strictly restricted to OWNER / Scoped BRANCH_ADMIN)
router.get(
  "/governance/:branchId",
  authenticate,
  authorize("OWNER", "BRANCH_ADMIN"),
  requireBranchAccess,
  ServiceController.getBranchGovernance
);

// 2. Master Catalog Listing & Dynamic Categories (Public / Guests / Authenticated)
router.get("/categories", optionalAuthenticate, ServiceController.getCategories);
router.post(
  "/categories",
  authenticate,
  authorize("OWNER", "BRANCH_ADMIN"),
  ServiceController.createCategory
);
router.get("/", optionalAuthenticate, ServiceController.listServices);
router.get("/:id", optionalAuthenticate, ServiceController.getServiceById);

// 3. Image Upload (OWNER or manage_services)
router.post(
  "/upload-image",
  authenticate,
  requirePermission("manage_services"),
  upload.single("image"),
  ServiceController.uploadServiceImage
);

// 4. Master Ritual Curation & Modifications (OWNER or BRANCH_ADMIN proposal)
router.post(
  "/",
  authenticate,
  authorize("OWNER", "BRANCH_ADMIN"),
  ServiceController.createService
);

router.patch(
  "/:id",
  authenticate,
  requirePermission("manage_services"),
  ServiceController.updateService
);

// 5. Service Status Toggle (Active / Inactive)
router.patch(
  "/:id/status",
  authenticate,
  requirePermission("manage_services"),
  ServiceController.toggleServiceStatus
);

router.patch(
  "/:id/toggle-status",
  authenticate,
  requirePermission("manage_services"),
  ServiceController.toggleServiceStatus
);

// 6. Branch Pricing & Historical Price Audits
router.post(
  "/:id/branch-price",
  authenticate,
  requirePermission("manage_prices"),
  ServiceController.setBranchPrice
);

router.get(
  "/:id/price-history",
  authenticate,
  requirePermission("view_reports"),
  ServiceController.getPriceHistory
);

// 7. Legacy Branch Rules Endpoint (Keep for backward compatibility)
router.put(
  "/:id/branches/:branchId",
  authenticate,
  authorize("OWNER", "BRANCH_ADMIN"),
  requireBranchAccess,
  requirePermission("manage_prices"),
  ServiceController.updateBranchRules
);

// 8. Branch Deposit Rule configuration
router.put(
  "/branches/:id/deposit-rule",
  authenticate,
  requirePermission("manage_prices"),
  ServiceController.setBranchDepositRule
);

export default router;
