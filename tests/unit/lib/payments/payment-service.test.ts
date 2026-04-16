import { describe, it, expect } from 'vitest';
import { calculateVat, getInstallmentOptions, formatIls } from '@/lib/payments/payment-service';

describe('payment service', () => {
  describe('calculateVat (PAYM-09)', () => {
    it('calculates 17% VAT correctly', () => {
      const result = calculateVat(10000); // 100 NIS
      expect(result.net).toBe(10000);
      expect(result.vat).toBe(1700);
      expect(result.gross).toBe(11700);
    });

    it('rounds VAT to nearest agora', () => {
      const result = calculateVat(333); // 3.33 NIS
      expect(result.vat).toBe(57); // 0.5661 → rounded to 57 agorot
      expect(result.gross).toBe(390);
    });

    it('handles zero amount', () => {
      const result = calculateVat(0);
      expect(result.net).toBe(0);
      expect(result.vat).toBe(0);
      expect(result.gross).toBe(0);
    });
  });

  describe('getInstallmentOptions (PAYM-02)', () => {
    it('returns only [1] for amounts < 500 NIS', () => {
      const options = getInstallmentOptions(49999); // 499.99 NIS
      expect(options).toEqual([1]);
    });

    it('returns multiple options for amounts >= 500 NIS', () => {
      const options = getInstallmentOptions(50000); // 500 NIS
      expect(options.length).toBeGreaterThan(1);
      expect(options[0]).toBe(1);
    });

    it('returns up to 12 installments for large amounts', () => {
      const options = getInstallmentOptions(1200000); // 12,000 NIS
      expect(options).toContain(12);
    });

    it('excludes installments with < 10 NIS per installment', () => {
      const options = getInstallmentOptions(60000); // 600 NIS
      // Each installment must be >= 10 NIS (1000 agorot)
      for (const n of options) {
        expect(Math.ceil(60000 / n)).toBeGreaterThanOrEqual(1000);
      }
    });
  });

  describe('formatIls', () => {
    it('formats agorot to NIS display', () => {
      expect(formatIls(10000)).toBe('₪100.00');
      expect(formatIls(1550)).toBe('₪15.50');
      expect(formatIls(0)).toBe('₪0.00');
    });
  });
});
