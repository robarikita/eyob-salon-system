import { Router } from "express";
import { EmployeeController } from "./employee.controller";
import { authenticate, optionalAuthenticate, authorize, requireBranchAccess } from "../../middleware/auth";

const router = Router();

// Public / Guest / Customer / Staff specialist roster
router.get("/", optionalAuthenticate, EmployeeController.getAllEmployees);

// Dashboard metrics (placed before /:id to avoid param capture)
router.get("/dashboard", authenticate, authorize("OWNER", "BRANCH_ADMIN"), EmployeeController.getDashboardMetrics);

// Administrative mutations and individual records
router.post("/", authenticate, authorize("OWNER", "BRANCH_ADMIN"), requireBranchAccess, EmployeeController.createEmployee);
router.get("/:id", authenticate, authorize("OWNER", "BRANCH_ADMIN", "EMPLOYEE"), EmployeeController.getEmployeeById);
router.patch("/:id", authenticate, authorize("OWNER", "BRANCH_ADMIN"), EmployeeController.updateEmployee);
router.patch("/:id/toggle-status", authenticate, authorize("OWNER", "BRANCH_ADMIN"), EmployeeController.toggleEmployeeStatus);
router.put("/:id/services", authenticate, authorize("OWNER", "BRANCH_ADMIN"), EmployeeController.assignServices);
router.get("/:id/schedule", authenticate, authorize("OWNER", "BRANCH_ADMIN", "EMPLOYEE"), EmployeeController.getSchedule);
router.put("/:id/schedule", authenticate, authorize("OWNER", "BRANCH_ADMIN"), EmployeeController.setSchedule);
router.post("/:id/exceptions", authenticate, authorize("OWNER", "BRANCH_ADMIN"), EmployeeController.createException);
router.delete("/:id/exceptions/:exceptionId", authenticate, authorize("OWNER", "BRANCH_ADMIN"), EmployeeController.deleteException);

export default router;
