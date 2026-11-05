import express from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./modules/auth/auth.routes";
import branchRoutes from "./modules/branch/branch.routes";
import employeeRoutes from "./modules/employee/employee.routes";
import serviceRoutes from "./modules/service/service.routes";
import {
  customerBookingRouter,
  staffAppointmentRouter,
  adminAppointmentRouter,
} from "./modules/booking/booking.routes";
import adminRoutes from "./modules/admin/admin.routes";

const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));

// Health Check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/branches", branchRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/services", serviceRoutes);
app.use("/api/v1/bookings", customerBookingRouter);
app.use("/api/v1/staff", staffAppointmentRouter);
app.use("/api/v1/admin/appointments", adminAppointmentRouter);
app.use("/api/v1/admin", adminRoutes);

// Error Handler
app.use(errorHandler);

export default app;
