import { z } from "zod";

export const createBranchSchema = z.object({
  name: z.string().min(3),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase and URL-friendly"),
  phoneNumber: z.string(),
  addressLine: z.string(),
  city: z.string().default("Addis Ababa"),
  slotBufferMinutes: z.number().int().min(0).default(10),
});

export const updateBranchSchema = createBranchSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const setBranchHoursSchema = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format must be HH:mm"),
    closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format must be HH:mm"),
    isClosed: z.boolean(),
  })
).length(7);
