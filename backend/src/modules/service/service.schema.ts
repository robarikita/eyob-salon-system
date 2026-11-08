import { z } from "zod";

export const DepositTypeEnum = z.enum(["NONE", "FIXED", "PERCENTAGE"]);

export const createServiceSchema = z.object({
  name: z.string().min(2, "Service name must be at least 2 characters"),
  nameAm: z.string().optional().nullable(),
  amharicName: z.string().optional().nullable(),
  slug: z.string().optional().nullable(),
  code: z
    .string()
    .optional()
    .transform((val) => (val ? val.toUpperCase().trim() : undefined)),
  category: z.string().optional().default("Hair Styling & Couture"),
  categoryId: z.string().optional().nullable(),
  subCategory: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionAm: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  cloudinaryPublicId: z.string().optional().nullable(),
  basePrice: z.number().min(0, "Base price cannot be negative"),
  durationMinutes: z.number().min(10, "Duration must be at least 10 minutes"),
  depositType: DepositTypeEnum.default("NONE"),
  depositValue: z.number().min(0).default(0),
  depositAmount: z.number().min(0).optional(),
  preSetupBuffer: z.number().min(0).default(0),
  turnaroundBuffer: z.number().min(0).default(15),
  workstationType: z.string().optional().nullable(),
  minGuildRank: z.string().optional().nullable(),
  requiresApprentice: z.boolean().default(false),
  requiredProtocols: z.array(z.string()).default([]),
  standardCommission: z.number().min(0).max(100).optional().nullable(),
  branchIds: z.array(z.string()).default([]),
  isActive: z.boolean().optional().default(true),
  reason: z.string().optional().nullable(),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  isActive: z.boolean().optional(),
  priceChangeReason: z.string().optional().nullable(),
});

export const branchPriceOverrideSchema = z.object({
  branchId: z.string().min(1, "Branch ID is required"),
  customPrice: z.number().min(0, "Custom price cannot be negative"),
  customDurationMinutes: z.number().min(10).optional().nullable(),
  depositType: DepositTypeEnum.optional().nullable(),
  depositValue: z.number().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
  reason: z.string().optional().nullable(),
  submitForApproval: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  nameAm: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters").optional(),
  nameAm: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const reviewGovernanceSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]).optional(),
  status: z.enum(["APPROVED", "REJECTED"]).optional(),
  action: z.enum(["APPROVE", "REJECT"]).optional(),
  reviewNote: z.string().optional().nullable(),
});

export const depositRuleSchema = z.object({
  depositType: DepositTypeEnum,
  depositValue: z.number().min(0, "Deposit value cannot be negative"),
});

export const updateBranchServiceRuleSchema = z.object({
  customPrice: z.number().min(0).optional().nullable(),
  customDurationMinutes: z.number().min(10).optional().nullable(),
  customTurnaround: z.number().min(0).optional().nullable(),
  depositType: DepositTypeEnum.optional().nullable(),
  depositValue: z.number().min(0).optional().nullable(),
  requiredDeposit: z.number().min(0).optional().nullable(),
  workstationLock: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type BranchPriceOverrideInput = z.infer<typeof branchPriceOverrideSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ReviewGovernanceInput = z.infer<typeof reviewGovernanceSchema>;
export type DepositRuleInput = z.infer<typeof depositRuleSchema>;
export type UpdateBranchServiceRuleInput = z.infer<typeof updateBranchServiceRuleSchema>;
