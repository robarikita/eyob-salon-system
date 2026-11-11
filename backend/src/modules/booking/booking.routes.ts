import { Router } from "express";
import { BookingController } from "./booking.controller";
import { StaffController } from "../employee/staff.controller";
import { authenticate, authorize, requireBranchAccess } from "../../middleware/auth";

// 1. Customer booking router
export const customerBookingRouter = Router();

// Availability query is public
customerBookingRouter.get("/availability", BookingController.getAvailableSlots);
customerBookingRouter.post("/availability/multi-service", BookingController.getMultiServiceAvailability);
customerBookingRouter.get("/availability/multi-service", BookingController.getMultiServiceAvailability);

// Authenticated customer booking actions
customerBookingRouter.post(
  "/",
  authenticate,
  authorize("CUSTOMER", "OWNER", "BRANCH_ADMIN"),
  BookingController.createBooking
);

customerBookingRouter.get(
  "/",
  authenticate,
  authorize("OWNER", "BRANCH_ADMIN", "EMPLOYEE"),
  BookingController.getAdminAppointments
);

customerBookingRouter.get(
  "/my-bookings",
  authenticate,
  BookingController.getMyBookings
);

customerBookingRouter.get(
  "/:idOrRef",
  authenticate,
  BookingController.getBookingByIdOrRef
);

customerBookingRouter.patch(
  "/:id/status",
  authenticate,
  BookingController.transitionStatus
);

customerBookingRouter.patch(
  "/:id/cancel",
  authenticate,
  BookingController.cancelBooking
);

customerBookingRouter.patch(
  "/:id/reschedule",
  authenticate,
  BookingController.rescheduleBooking
);

customerBookingRouter.post(
  "/items/:itemId/review",
  authenticate,
  authorize("CUSTOMER", "OWNER"),
  BookingController.createReview
);

// 2. Staff personal portal & appointment router
export const staffAppointmentRouter = Router();

staffAppointmentRouter.use(authenticate, authorize("EMPLOYEE", "BRANCH_ADMIN", "OWNER"));

staffAppointmentRouter.get("/me", StaffController.getMe);
staffAppointmentRouter.get("/schedule", StaffController.getMySchedule);
staffAppointmentRouter.get("/appointments", StaffController.getMyAppointments);
staffAppointmentRouter.patch("/appointments/:id/accept", BookingController.acceptStaffAppointment);
staffAppointmentRouter.patch("/appointments/:id/reject", BookingController.rejectStaffAppointment);
staffAppointmentRouter.patch("/appointments/:id/status", BookingController.updateStaffAppointmentStatus);
staffAppointmentRouter.get("/availability", BookingController.getStaffAvailability);
staffAppointmentRouter.post("/availability/exception", BookingController.toggleStaffException);

// 3. Admin appointment router
export const adminAppointmentRouter = Router();

adminAppointmentRouter.use(authenticate, authorize("BRANCH_ADMIN", "OWNER"));

adminAppointmentRouter.get("/reports/income", requireBranchAccess, BookingController.getIncomeReport);
adminAppointmentRouter.get("/", requireBranchAccess, BookingController.getAdminAppointments);
adminAppointmentRouter.patch("/:id/status", BookingController.updateAdminAppointmentStatus);

