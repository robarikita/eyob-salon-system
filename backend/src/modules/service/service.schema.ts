import { z } from "zod";

export const createServiceSchema = z.object({
  code: z
    .string()
    .min(2, "Service code must be at least 2 characters")
    .transform((val) => val.toUpperCase().trim()),
  name: z.string().min(2, "Service name must be at least 2 characters"),
  amharicName: z.string().optional().nullable(),
  category: z.string().min(2, "Category is required"),
  subCategory: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  basePrice: z.number().min(0, "Base price cannot be negative"),
  durationMinutes: z.number().min(15, "Duration must be at least 15 minutes"),
  preSetupBuffer: z.number().min(0).default(0),
  turnaroundBuffer: z.number().min(0).default(15),
  workstationType: z.string().optional().nullable(),
  minGuildRank: z.string().optional().nullable(),
  requiresApprentice: z.boolean().default(false),
  requiredProtocols: z.array(z.string()).default([]),
  standardCommission: z.number().min(0).max(100).optional().nullable(),
  depositAmount: z.number().min(0).optional().default(100),
  branchIds: z.array(z.string()).default([]),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const updateBranchServiceRuleSchema = z.object({
  customPrice: z.number().min(0).optional().nullable(),
  customDurationMinutes: z.number().min(15).optional().nullable(),
  customTurnaround: z.number().min(0).optional().nullable(),
  requiredDeposit: z.number().min(0).optional().nullable(),
  workstationLock: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type UpdateBranchServiceRuleInput = z.infer<typeof updateBranchServiceRuleSchema>;
