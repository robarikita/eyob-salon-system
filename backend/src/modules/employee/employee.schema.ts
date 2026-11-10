import { z } from "zod";

export const createEmployeeSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  amharicName: z.string().optional().nullable(),
  phone: z.string().min(5, "Phone number is required"),
  email: z.string().email("Invalid email address").optional().nullable(),
  branchId: z.string().uuid("Invalid branch ID"),
  title: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  ritualTitle: z.string().optional().nullable(),
  employmentType: z.string().optional().nullable(),
  workstation: z.string().optional().nullable(),
  joinedDate: z.string().or(z.date()).optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  baseSalary: z.number().min(0).optional().nullable(),
  commissionRate: z.number().min(0).max(100).optional().nullable(),
  createLoginAccount: z.boolean().optional(),
  createPortalAccess: z.boolean().optional(),
  password: z.string().min(6).optional().nullable(),
  tempPassword: z.string().min(6).optional().nullable(),
  isActive: z.boolean().optional(),
  hireReason: z.string().optional().nullable(),
  requestedBy: z.string().optional().nullable(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  status: z.union([z.boolean(), z.string()]).optional(),
  isActive: z.boolean().optional(),
  hireReason: z.string().optional().nullable(),
  requestedBy: z.string().optional().nullable(),
});

export const assignServicesSchema = z.object({
  services: z.array(
    z.object({
      serviceId: z.string().uuid("Invalid service ID"),
      customDurationMinutes: z.number().int().positive().optional().nullable(),
      customCommissionRate: z.number().min(0).max(100).optional().nullable(),
    })
  ).optional(),
  serviceIds: z.array(z.string().uuid("Invalid service ID")).optional(),
});

export const setEmployeeScheduleSchema = z.object({
  schedules: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
      breakStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)").optional().nullable(),
      breakEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)").optional().nullable(),
      isWorking: z.boolean(),
    })
  ).min(1, "At least one schedule day required"),
});

export const createExceptionSchema = z.object({
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
  isOff: z.boolean().optional(),
  isOffDay: z.boolean().optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().nullable(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().nullable(),
  customStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().nullable(),
  customEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().nullable(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type AssignServicesInput = z.infer<typeof assignServicesSchema>;
export type SetEmployeeScheduleInput = z.infer<typeof setEmployeeScheduleSchema>;
export type CreateExceptionInput = z.infer<typeof createExceptionSchema>;

