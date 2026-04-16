import type {
  CategoryLegalRules,
  DepositCapRule,
  RepairTimelineRule,
  ProhibitedChargesRule,
} from '@/schemas/legal-rules';
import { CategoryLegalRulesSchema } from '@/schemas/legal-rules';

/**
 * LREG-01: Validate security deposit cap.
 * Deposit must be ≤ min(1/3 total lease, 3 months' rent).
 */
export function validateSecurityDeposit(
  deposit: number,
  monthlyRent: number,
  leaseDurationMonths: number,
  rule?: DepositCapRule,
): { valid: boolean; maxAllowed: number; reason?: string } {
  const maxFraction = rule?.maxFractionOfTotal ?? 1 / 3;
  const maxMonths = rule?.maxMonths ?? 3;

  const totalLeaseValue = monthlyRent * leaseDurationMonths;
  const fractionCap = totalLeaseValue * maxFraction;
  const monthsCap = monthlyRent * maxMonths;
  const maxAllowed = Math.min(fractionCap, monthsCap);

  if (deposit > maxAllowed) {
    return {
      valid: false,
      maxAllowed: Math.round(maxAllowed * 100) / 100,
      reason: `deposit_exceeds_cap`,
    };
  }

  return { valid: true, maxAllowed };
}

/**
 * LREG-02: Get mandatory repair timelines for residential leases.
 * These are hardcoded per Israeli Fair Rent Law.
 */
export function getRepairTimelines(rule?: RepairTimelineRule): {
  urgentDays: number;
  nonUrgentDays: number;
} {
  return {
    urgentDays: rule?.urgentDays ?? 3,
    nonUrgentDays: rule?.nonUrgentDays ?? 30,
  };
}

/**
 * LREG-03: Get list of prohibited charges for residential leases.
 * These fields should be disabled or hidden in the wizard.
 */
export function getProhibitedFieldKeys(rules: CategoryLegalRules): string[] {
  const prohibitedRule = rules.rules.find(
    (r): r is ProhibitedChargesRule => r.type === 'prohibited-charges' && r.enabled,
  );
  return prohibitedRule?.prohibitedFieldKeys ?? [];
}

/**
 * LREG-06: Get dispute resolution options.
 * Always returns standard options; includes Sulha mediation for applicable categories.
 */
export function getDisputeResolutionOptions(
  rules: CategoryLegalRules,
): Array<{ value: string; labelKey: string }> {
  const options: Array<{ value: string; labelKey: string }> = [
    { value: 'court', labelKey: 'legal.disputeResolution.court' },
    { value: 'arbitration', labelKey: 'legal.disputeResolution.arbitration' },
  ];

  const drRule = rules.rules.find((r) => r.type === 'dispute-resolution' && r.enabled);
  if (drRule && 'includeSulha' in drRule && drRule.includeSulha) {
    options.splice(1, 0, {
      value: 'sulha',
      labelKey: 'legal.disputeResolution.sulha',
    });
  }

  return options;
}

/**
 * Parse and validate legal rules from a JSON value.
 */
export function parseLegalRules(json: unknown): CategoryLegalRules {
  const parsed = CategoryLegalRulesSchema.safeParse(json);
  if (parsed.success) return parsed.data;
  return { rules: [] };
}

/**
 * LREG: Run all applicable legal validations for a wizard step.
 * Returns a map of field key → error message key.
 */
export function runLegalValidations(
  wizardData: Record<string, unknown>,
  rules: CategoryLegalRules,
): Record<string, string> {
  const errors: Record<string, string> = {};

  // LREG-01: Deposit cap validation
  const depositRule = rules.rules.find(
    (r): r is DepositCapRule => r.type === 'deposit-cap' && r.enabled,
  );

  if (depositRule) {
    const deposit = Number(wizardData[depositRule.depositFieldKey]) || 0;
    const monthlyRent = Number(wizardData[depositRule.monthlyRentFieldKey]) || 0;

    // Calculate lease duration — default to 12 months if not specified
    let leaseDurationMonths = 12;
    if (depositRule.leaseDurationMonthsFieldKey) {
      leaseDurationMonths = Number(wizardData[depositRule.leaseDurationMonthsFieldKey]) || 12;
    }

    if (deposit > 0 && monthlyRent > 0) {
      const result = validateSecurityDeposit(
        deposit,
        monthlyRent,
        leaseDurationMonths,
        depositRule,
      );
      if (!result.valid) {
        errors[depositRule.depositFieldKey] = `legal.depositExceedsCap`;
      }
    }
  }

  return errors;
}
