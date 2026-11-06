import { z } from "zod";
import { ValidationError } from "../../errors/AppError";

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const createBranchSchema = z
  .object({
    name: z.string().min(2, "Branch name must be at least 2 characters"),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase and URL-friendly")
      .optional(),
    phoneNumber: z.string().optional(),
    phone: z.string().optional(),
    addressLine: z.string().optional(),
    address: z.string().optional(),
    city: z.string().default("Addis Ababa"),
    description: z.string().optional().nullable(),
    timezone: z.string().default("Africa/Addis_Ababa"),
    slotBufferMinutes: z.number().int().min(0).default(10),
  })
  .refine((data) => !!(data.phoneNumber || data.phone), {
    message: "Phone number is required",
    path: ["phone"],
  })
  .refine((data) => !!(data.addressLine || data.address), {
    message: "Address is required",
    path: ["address"],
  });

export const updateBranchSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase and URL-friendly")
    .optional(),
  phoneNumber: z.string().optional(),
  phone: z.string().optional(),
  addressLine: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  description: z.string().optional().nullable(),
  timezone: z.string().optional(),
  slotBufferMinutes: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const assignAdminSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
});

export const businessHourDaySchema = z.object({
  dayOfWeek: z.union([z.number().int().min(0).max(6), z.string()]),
  openTime: z.string().regex(timeRegex, "Format must be HH:mm"),
  closeTime: z.string().regex(timeRegex, "Format must be HH:mm"),
  closesNextDay: z.boolean().default(false),
  isClosed: z.boolean().default(false),
});

export const updateBusinessHoursSchema = z.union([
  z.array(businessHourDaySchema).min(1).max(7),
  businessHourDaySchema,
]);

export const setBranchHoursSchema = updateBusinessHoursSchema;

export function normalizeDayOfWeek(val: number | string): number {
  if (typeof val === "number") {
    if (val >= 0 && val <= 6) return val;
    throw new ValidationError(`Invalid dayOfWeek: ${val}. Must be 0 to 6.`);
  }
  const str = String(val).trim().toUpperCase();
  const map: Record<string, number> = {
    SUNDAY: 0,
    SUN: 0,
    MONDAY: 1,
    MON: 1,
    TUESDAY: 2,
    TUE: 2,
    WEDNESDAY: 3,
    WED: 3,
    THURSDAY: 4,
    THU: 4,
    FRIDAY: 5,
    FRI: 5,
    SATURDAY: 6,
    SAT: 6,
  };
  if (map[str] !== undefined) return map[str];
  throw new ValidationError(`Invalid dayOfWeek: "${val}". Must be SUNDAY..SATURDAY.`);
}

export function getDayName(day: number): string {
  const names = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  return names[day] || "UNKNOWN";
}
