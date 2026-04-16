import { describe, it, expect } from 'vitest';
import { renderInvoiceHtml } from '@/lib/payments/invoice-generator';

describe('invoice-generator rounding logic', () => {
  const mockData = {
    invoiceNumber: 'INV-2026-000001',
    issueDate: new Date(),
    customerName: 'Test Customer',
    items: [{ description: 'Test Item', amount: 8547 }],
    netAmount: 8547,
    vatAmount: 1453,
    grossAmount: 10000,
    installments: 3,
  };

  it('should show correct installment breakdown for non-divisible amounts', () => {
    const html = renderInvoiceHtml(mockData);
    // Current logic: 2 × floor(10000/3) + 1 × (10000 - 2*3333)
    // should be: 2 × 33.33 + 1 × 33.34
    expect(html).toContain('2 × ₪33.33');
    expect(html).toContain('+ 1 × ₪33.34');
  });

  it('should show correct installment breakdown for evenly divisible amounts', () => {
    const html = renderInvoiceHtml({ ...mockData, grossAmount: 9000 });
    // 2 × 30.00 + 1 × 30.00
    expect(html).toContain('2 × ₪30.00');
    expect(html).toContain('+ 1 × ₪30.00');
  });
});
