import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { clearDbData, seedTestUser, seedPlan } from '../../../test-utils';

// ---------- mocks ----------

let mockSession: { user: { id: string; email: string } } | null = null;

vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}));

// ---------- import handler after mocks ----------

let GET: () => Promise<Response>;

beforeAll(async () => {
  const mod = await import('../../../../src/app/api/payments/invoices/route');
  GET = mod.GET;
});

// ---------- tests ----------

describe('GET /api/payments/invoices', () => {
  let user: Awaited<ReturnType<typeof seedTestUser>>;
  let otherUser: Awaited<ReturnType<typeof db.user.create>>;

  beforeAll(async () => {
    await clearDbData();
    user = await seedTestUser();
    otherUser = await db.user.create({
      data: { email: 'other@example.com', name: 'Other User', role: 'USER' },
    });

    await seedPlan();

    // Create a payment + invoice for the primary test user
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        amount: 4900,
        vatAmount: 833,
        currency: 'ILS',
        status: 'COMPLETED',
        installments: 1,
        gatewayRef: 'gw-inv-test',
      },
    });

    await db.invoice.create({
      data: {
        paymentId: payment.id,
        invoiceNumber: 'INV-2026-000099',
        type: 'TAX_RECEIPT',
        amount: 4900,
        vatAmount: 833,
      },
    });
  });

  afterAll(async () => {
    await clearDbData();
  });

  beforeEach(() => {
    mockSession = { user: { id: user.id, email: user.email } };
  });

  it('lists invoices for the authenticated user', async () => {
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBe(1);
    expect(json.data[0].invoiceNumber).toBe('INV-2026-000099');
    expect(json.data[0].payment).toBeDefined();
    expect(json.data[0].payment.amount).toBe(4900);
  });

  it('returns empty array for user with no invoices', async () => {
    mockSession = { user: { id: otherUser.id, email: otherUser.email } };

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual([]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockSession = null;

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });
});
