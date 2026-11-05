import { z } from "zod";

export const availabilityQuerySchema = z.object({
  branchId: z.string().uuid("Invalid branchId UUID"),
  serviceId: z.string().min(1, "Service ID is required"),
  employeeId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export const createBookingSchema = z.object({
  branchId: z.string().uuid("Invalid branchId UUID"),
  serviceId: z.string().min(1, "Service ID is required"),
  employeeId: z.string().uuid("Invalid employeeId UUID"),
  startTime: z.string().datetime({ message: "Invalid ISO startTime" }),
  notes: z.string().max(1000).optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const rescheduleBookingSchema = z.object({
  newStartTime: z.string().datetime({ message: "Invalid ISO newStartTime" }),
  employeeId: z.string().uuid().optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum([
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "REJECTED",
    "CANCELLED",
    "NO_SHOW",
  ]),
  reason: z.string().max(500).optional(),
});

export const staffExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  isWorking: z.boolean(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:mm").optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:mm").optional(),
  reason: z.string().max(500).optional(),
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type StaffExceptionInput = z.infer<typeof staffExceptionSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
