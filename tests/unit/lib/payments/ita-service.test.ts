import { describe, it, expect } from 'vitest';
import { requestItaAllocation, buildItaPayload } from '@/lib/payments/ita-service';

describe('ITA service', () => {
  describe('requestItaAllocation (PAYM-04)', () => {
    it('returns 9-digit allocation number on success', async () => {
      const result = await requestItaAllocation({
        customerVatNumber: '123456789',
        invoiceDate: '2026-02-28',
        invoiceAmount: 10000,
        accountingSoftwareNumber: '999999999',
      });
      expect(result.success).toBe(true);
      expect(result.allocationNumber).toMatch(/^\d{9}$/);
    });

    it('rejects invalid VAT number', async () => {
      const result = await requestItaAllocation({
        customerVatNumber: '12345', // Too short
        invoiceDate: '2026-02-28',
        invoiceAmount: 10000,
        accountingSoftwareNumber: '999999999',
      });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_VAT');
    });

    it('rejects zero amount', async () => {
      const result = await requestItaAllocation({
        customerVatNumber: '123456789',
        invoiceDate: '2026-02-28',
        invoiceAmount: 0,
        accountingSoftwareNumber: '999999999',
      });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_AMOUNT');
    });
  });

  describe('buildItaPayload (PAYM-05)', () => {
    it('constructs conforming payload', () => {
      const payload = buildItaPayload('123456789', new Date('2026-02-28'), 10000);
      expect(payload.customerVatNumber).toBe('123456789');
      expect(payload.invoiceDate).toBe('2026-02-28');
      expect(payload.invoiceAmount).toBe(10000);
      expect(payload.accountingSoftwareNumber).toBeDefined();
    });
  });
});
