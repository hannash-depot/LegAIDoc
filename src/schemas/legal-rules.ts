import { z } from 'zod/v4';

/**
 * LREG: Legal rule configuration stored in Category.legalRules.
 * Defines per-category legal constraints that the wizard enforces.
 */

export const DepositCapRuleSchema = z.object({
  type: z.literal('deposit-cap'),
  enabled: z.boolean(),
  // LREG-01: deposit ≤ min(totalLease * maxFractionOfTotal, monthlyRent * maxMonths)
  maxFractionOfTotal: z.number().default(1 / 3),
  maxMonths: z.number().int().default(3),
  depositFieldKey: z.string(),
  monthlyRentFieldKey: z.string(),
  leaseDurationMonthsFieldKey: z.string().optional(),
});

export const RepairTimelineRuleSchema = z.object({
  type: z.literal('repair-timeline'),
  enabled: z.boolean(),
  // LREG-02: mandatory repair timelines for residential leases
  urgentDays: z.number().int().default(3),
  nonUrgentDays: z.number().int().default(30),
});

export const ProhibitedChargesRuleSchema = z.object({
  type: z.literal('prohibited-charges'),
  enabled: z.boolean(),
  // LREG-03: fields that should be disabled/hidden for this category
  prohibitedFieldKeys: z.array(z.string()),
});

export const DisputeResolutionRuleSchema = z.object({
  type: z.literal('dispute-resolution'),
  enabled: z.boolean(),
  // LREG-06: include Sulha mediation option
  includeSulha: z.boolean().default(true),
});

export const LegalRuleSchema = z.union([
  DepositCapRuleSchema,
  RepairTimelineRuleSchema,
  ProhibitedChargesRuleSchema,
  DisputeResolutionRuleSchema,
]);

export const CategoryLegalRulesSchema = z.object({
  rules: z.array(LegalRuleSchema).default([]),
});

export type CategoryLegalRules = z.infer<typeof CategoryLegalRulesSchema>;
export type DepositCapRule = z.infer<typeof DepositCapRuleSchema>;
export type RepairTimelineRule = z.infer<typeof RepairTimelineRuleSchema>;
export type ProhibitedChargesRule = z.infer<typeof ProhibitedChargesRuleSchema>;
export type DisputeResolutionRule = z.infer<typeof DisputeResolutionRuleSchema>;
export type LegalRule = z.infer<typeof LegalRuleSchema>;
