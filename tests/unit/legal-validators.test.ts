import { describe, it, expect } from 'vitest';
import { validateSecurityDeposit, runLegalValidations } from '@/lib/legal/legal-validators';
import type { CategoryLegalRules } from '@/schemas/legal-rules';

describe('legal-validators', () => {
  describe('validateSecurityDeposit', () => {
    it('should allow deposit within legal cap', () => {
      const result = validateSecurityDeposit(15000, 5000, 12);
      expect(result.valid).toBe(true);
    });

    it('should block deposit exceeding 3 months rent', () => {
      const result = validateSecurityDeposit(16000, 5000, 12);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('deposit_exceeds_cap');
    });

    it('should block deposit exceeding 1/3 of total lease (long lease)', () => {
      // 5000 * 24 = 120,000. 1/3 = 40,000. 3 months = 15,000. Cap is 15,000.
      const result = validateSecurityDeposit(16000, 5000, 24);
      expect(result.valid).toBe(false);
    });

    it('should block deposit exceeding 1/3 of total lease (short lease)', () => {
      // 5000 * 6 = 30,000. 1/3 = 10,000. 3 months = 15,000. Cap is 10,000.
      const result = validateSecurityDeposit(11000, 5000, 6);
      expect(result.valid).toBe(false);
      expect(result.maxAllowed).toBe(10000);
    });
  });

  describe('runLegalValidations', () => {
    const mockRules: CategoryLegalRules = {
      rules: [
        {
          type: 'deposit-cap',
          enabled: true,
          depositFieldKey: 'deposit',
          monthlyRentFieldKey: 'rent',
          leaseDurationMonthsFieldKey: 'duration',
          maxFractionOfTotal: 1 / 3,
          maxMonths: 3,
        },
      ],
    };

    it('should return error if deposit exceeds cap', () => {
      const data = {
        deposit: 16000,
        rent: 5000,
        duration: 12,
      };
      const errors = runLegalValidations(data, mockRules);
      expect(errors.deposit).toBe('legal.depositExceedsCap');
    });

    it('should return no errors if within cap', () => {
      const data = {
        deposit: 15000,
        rent: 5000,
        duration: 12,
      };
      const errors = runLegalValidations(data, mockRules);
      expect(Object.keys(errors).length).toBe(0);
    });
  });
});
