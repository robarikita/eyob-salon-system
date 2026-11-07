import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")).nullable(),
  phone: z.string().min(9, "Phone number must be at least 9 characters").optional(),
  preferredLang: z.enum(["EN", "AM"]).optional(),
  smsNotifications: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

