import { describe, it, expect } from 'vitest';
import {
  validateSecurityDeposit,
  getRepairTimelines,
  getProhibitedFieldKeys,
  getDisputeResolutionOptions,
  runLegalValidations,
  parseLegalRules,
} from '@/lib/legal/legal-validators';

describe('legal validators', () => {
  describe('validateSecurityDeposit (LREG-01)', () => {
    it('allows deposit within cap (3 months rule)', () => {
      // 3000/month, 12 months = 36000 total
      // 1/3 of total = 12000
      // 3 months = 9000
      // cap = min(12000, 9000) = 9000
      const result = validateSecurityDeposit(9000, 3000, 12);
      expect(result.valid).toBe(true);
      expect(result.maxAllowed).toBe(9000);
    });

    it('rejects deposit exceeding cap', () => {
      const result = validateSecurityDeposit(10000, 3000, 12);
      expect(result.valid).toBe(false);
      expect(result.maxAllowed).toBe(9000);
      expect(result.reason).toBe('deposit_exceeds_cap');
    });

    it('uses 1/3 fraction rule when it is lower', () => {
      // 5000/month, 6 months = 30000 total
      // 1/3 of total = 10000
      // 3 months = 15000
      // cap = min(10000, 15000) = 10000
      const result = validateSecurityDeposit(10000, 5000, 6);
      expect(result.valid).toBe(true);
      expect(result.maxAllowed).toBe(10000);
    });

    it('rejects when exceeding fraction cap on short lease', () => {
      const result = validateSecurityDeposit(11000, 5000, 6);
      expect(result.valid).toBe(false);
      expect(result.maxAllowed).toBe(10000);
    });

    it('allows zero deposit', () => {
      const result = validateSecurityDeposit(0, 3000, 12);
      expect(result.valid).toBe(true);
    });
  });

  describe('getRepairTimelines (LREG-02)', () => {
    it('returns default Israeli statutory timelines', () => {
      const timelines = getRepairTimelines();
      expect(timelines.urgentDays).toBe(3);
      expect(timelines.nonUrgentDays).toBe(30);
    });

    it('respects custom rule values', () => {
      const timelines = getRepairTimelines({
        type: 'repair-timeline',
        enabled: true,
        urgentDays: 5,
        nonUrgentDays: 45,
      });
      expect(timelines.urgentDays).toBe(5);
      expect(timelines.nonUrgentDays).toBe(45);
    });
  });

  describe('getProhibitedFieldKeys (LREG-03)', () => {
    it('returns empty array when no rules', () => {
      const keys = getProhibitedFieldKeys({ rules: [] });
      expect(keys).toEqual([]);
    });

    it('returns prohibited field keys from active rule', () => {
      const keys = getProhibitedFieldKeys({
        rules: [
          {
            type: 'prohibited-charges',
            enabled: true,
            prohibitedFieldKeys: ['brokerFee', 'buildingInsurance'],
          },
        ],
      });
      expect(keys).toEqual(['brokerFee', 'buildingInsurance']);
    });

    it('ignores disabled rule', () => {
      const keys = getProhibitedFieldKeys({
        rules: [
          {
            type: 'prohibited-charges',
            enabled: false,
            prohibitedFieldKeys: ['brokerFee'],
          },
        ],
      });
      expect(keys).toEqual([]);
    });
  });

  describe('getDisputeResolutionOptions (LREG-06)', () => {
    it('always includes court and arbitration', () => {
      const options = getDisputeResolutionOptions({ rules: [] });
      expect(options.map((o) => o.value)).toContain('court');
      expect(options.map((o) => o.value)).toContain('arbitration');
    });

    it('includes Sulha when enabled', () => {
      const options = getDisputeResolutionOptions({
        rules: [{ type: 'dispute-resolution', enabled: true, includeSulha: true }],
      });
      expect(options.map((o) => o.value)).toContain('sulha');
    });

    it('excludes Sulha when rule not present', () => {
      const options = getDisputeResolutionOptions({ rules: [] });
      expect(options.map((o) => o.value)).not.toContain('sulha');
    });
  });

  describe('parseLegalRules', () => {
    it('parses valid rules JSON', () => {
      const rules = parseLegalRules({
        rules: [{ type: 'repair-timeline', enabled: true, urgentDays: 3, nonUrgentDays: 30 }],
      });
      expect(rules.rules).toHaveLength(1);
      expect(rules.rules[0].type).toBe('repair-timeline');
    });

    it('returns empty rules for invalid input', () => {
      const rules = parseLegalRules('invalid');
      expect(rules.rules).toEqual([]);
    });
  });

  describe('runLegalValidations', () => {
    it('returns deposit error when exceeding cap', () => {
      const errors = runLegalValidations(
        { securityDeposit: 20000, monthlyRent: 5000 },
        {
          rules: [
            {
              type: 'deposit-cap',
              enabled: true,
              maxFractionOfTotal: 1 / 3,
              maxMonths: 3,
              depositFieldKey: 'securityDeposit',
              monthlyRentFieldKey: 'monthlyRent',
            },
          ],
        },
      );
      expect(errors['securityDeposit']).toBe('legal.depositExceedsCap');
    });

    it('returns no errors when deposit is valid', () => {
      const errors = runLegalValidations(
        { securityDeposit: 10000, monthlyRent: 5000 },
        {
          rules: [
            {
              type: 'deposit-cap',
              enabled: true,
              maxFractionOfTotal: 1 / 3,
              maxMonths: 3,
              depositFieldKey: 'securityDeposit',
              monthlyRentFieldKey: 'monthlyRent',
            },
          ],
        },
      );
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });
});
