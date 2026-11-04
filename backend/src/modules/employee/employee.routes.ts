import { Router } from "express";
import { EmployeeController } from "./employee.controller";
import { authenticate, authorize, requireBranchAccess } from "../../middleware/auth";

const router = Router();

// All employee management routes require authentication
router.use(authenticate);

// Dashboard metrics (placed before /:id to avoid param capture)
router.get("/dashboard", authorize("OWNER", "BRANCH_ADMIN"), EmployeeController.getDashboardMetrics);

// Roster collection
router.get("/", authorize("OWNER", "BRANCH_ADMIN"), EmployeeController.getAllEmployees);
router.post("/", authorize("OWNER", "BRANCH_ADMIN"), requireBranchAccess, EmployeeController.createEmployee);

// Specific specialist operations: GET /:id allows OWNER, BRANCH_ADMIN, and EMPLOYEE (with IDOR protection)
router.get("/:id", authorize("OWNER", "BRANCH_ADMIN", "EMPLOYEE"), EmployeeController.getEmployeeById);

// Administrative mutations require OWNER or BRANCH_ADMIN
router.patch("/:id", authorize("OWNER", "BRANCH_ADMIN"), EmployeeController.updateEmployee);
router.patch("/:id/toggle-status", authorize("OWNER", "BRANCH_ADMIN"), EmployeeController.toggleEmployeeStatus);
router.put("/:id/services", authorize("OWNER", "BRANCH_ADMIN"), EmployeeController.assignServices);
router.put("/:id/schedule", authorize("OWNER", "BRANCH_ADMIN"), EmployeeController.setSchedule);
router.post("/:id/exceptions", authorize("OWNER", "BRANCH_ADMIN"), EmployeeController.createException);

export default router;
