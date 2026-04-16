import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { clearDbData, seedTestUser, seedPlan } from '../../../test-utils';

// ---------- mocks ----------

let mockSession: { user: { id: string; email: string } } | null = null;

vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}));

vi.mock('@/lib/audit/audit-trail', () => ({
  logAudit: vi.fn(),
}));

vi.mock('@/lib/api/rate-limit', () => ({
  rateLimit: vi.fn(() => Promise.resolve({ success: true, remaining: 99, resetMs: 60000 })),
  getEnvDefaults: vi.fn(() => ({
    windowMs: 60000,
    maxAuthenticated: 100,
    maxUnauthenticated: 20,
  })),
}));

let featurePaymentsEnabled = true;
vi.mock('@/lib/feature-flags', () => ({
  get FEATURE_PAYMENTS() {
    return featurePaymentsEnabled;
  },
}));

vi.mock('@/lib/payments/payment-service', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/payments/payment-service')>();
  return {
    ...original,
    chargePaymentGateway: vi.fn(() => Promise.resolve({ success: true, gatewayRef: 'gw-test' })),
  };
});

vi.mock('@/lib/payments/ita-service', () => ({
  requestItaAllocation: vi.fn(() =>
    Promise.resolve({ success: true, allocationNumber: '123456789' }),
  ),
  buildItaPayload: vi.fn((vatNumber: string, date: Date, amount: number) => ({
    customerVatNumber: vatNumber,
    invoiceDate: date.toISOString(),
    invoiceAmount: amount,
    accountingSoftwareNumber: '999999999',
  })),
}));

vi.mock('@/lib/payments/invoice-generator', () => ({
  renderInvoiceHtml: vi.fn(),
  generateInvoiceNumber: vi.fn(() => Promise.resolve('INV-2026-000001')),
}));

// ---------- import handler after mocks ----------

let POST: (req: NextRequest, ...args: unknown[]) => Promise<Response>;

beforeAll(async () => {
  const mod = await import('../../../../src/app/api/payments/checkout/route');
  POST = mod.POST;
});

// ---------- helpers ----------

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/payments/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---------- tests ----------

describe('POST /api/payments/checkout', () => {
  let user: Awaited<ReturnType<typeof seedTestUser>>;
  let plan: Awaited<ReturnType<typeof seedPlan>>;

  beforeAll(async () => {
    await clearDbData();
    user = await seedTestUser();
    plan = await seedPlan();
  });

  afterAll(async () => {
    await clearDbData();
  });

  beforeEach(() => {
    mockSession = { user: { id: user.id, email: user.email } };
    featurePaymentsEnabled = true;
  });

  it('creates payment, subscription, and invoice on successful checkout', async () => {
    const res = await POST(makeRequest({ planId: plan.id }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.payment).toBeDefined();
    expect(json.data.subscription).toBeDefined();
    expect(json.data.invoice).toBeDefined();

    // Verify DB records
    const payment = await db.payment.findUnique({ where: { id: json.data.payment.id } });
    expect(payment).not.toBeNull();
    expect(payment!.status).toBe('COMPLETED');
    expect(payment!.gatewayRef).toBe('gw-test');
    expect(payment!.userId).toBe(user.id);

    const subscription = await db.subscription.findUnique({
      where: { id: json.data.subscription.id },
    });
    expect(subscription).not.toBeNull();
    expect(subscription!.status).toBe('ACTIVE');
    expect(subscription!.planId).toBe(plan.id);

    const invoice = await db.invoice.findUnique({ where: { id: json.data.invoice.id } });
    expect(invoice).not.toBeNull();
    expect(invoice!.invoiceNumber).toBe('INV-2026-000001');
  });

  it('returns 404 for non-existent plan', async () => {
    const res = await POST(makeRequest({ planId: 'non-existent-id' }));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('PLAN_NOT_FOUND');
  });

  it('returns 403 when FEATURE_PAYMENTS is disabled', async () => {
    featurePaymentsEnabled = false;

    const res = await POST(makeRequest({ planId: plan.id }));
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('FEATURE_DISABLED');
  });

  it('returns 401 when unauthenticated', async () => {
    mockSession = null;

    const res = await POST(makeRequest({ planId: plan.id }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('returns 400 for missing planId', async () => {
    const res = await POST(makeRequest({}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });
});
