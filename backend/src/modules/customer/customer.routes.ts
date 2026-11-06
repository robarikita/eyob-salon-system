import { Router } from "express";
import { CustomerController } from "./customer.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/me", CustomerController.getMe);
router.patch("/me", CustomerController.updateMe);

export default router;
