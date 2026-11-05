import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../middleware/auth";
import { loginRateLimiter, generalAuthRateLimiter } from "../../middleware/rateLimiter";

const router = Router();

router.post("/register", generalAuthRateLimiter, AuthController.register);
router.post("/login", loginRateLimiter, AuthController.login);
router.post("/forgot-password", generalAuthRateLimiter, AuthController.forgotPassword);
router.post("/reset-password", generalAuthRateLimiter, AuthController.resetPassword);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);
router.get("/me", authenticate, AuthController.getMe);

export default router;
