/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, afterAll } from 'vitest';
import { db } from '../../../../src/lib/db';
import { clearDbData, seedTestUser } from '../../../test-utils';
import { POST } from '../../../../src/app/api/payments/webhook/route';
import { NextRequest } from 'next/server';

const WEBHOOK_SECRET = 'test_secret';

describe('Webhook API (/api/payments/webhook)', () => {
  let testUser: any;
  let testPlan: any;

  beforeAll(async () => {
    process.env.PAYMENT_WEBHOOK_SECRET = WEBHOOK_SECRET;
    await clearDbData();
    testUser = await seedTestUser();

    // Create a test plan
    testPlan = await db.plan.create({
      data: {
        slug: 'pro-test',
        nameHe: 'פרו',
        nameAr: 'Pro',
        nameEn: 'Pro',
        nameRu: 'Pro',
        priceIls: 10000,
        features: [],
      },
    });
  });

  afterAll(async () => {
    await clearDbData();
  });

  const createRequest = (body: any, secret: string = WEBHOOK_SECRET) => {
    return new NextRequest('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': secret,
      },
      body: JSON.stringify(body),
    });
  };

  test('should reject requests without a secret', async () => {
    const req = createRequest({ event: 'test', data: {} }, '');
    const res = await POST(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  test('should reject requests with invalid secret', async () => {
    const req = createRequest({ event: 'test', data: {} }, 'wrong-secret');
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  test('should reject malformed payload', async () => {
    const req = createRequest({ foo: 'bar' });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('INVALID_PAYLOAD');
  });

  // We can test 'fallback' for unknown events
  test('should succeed on unknown events with no action taken', async () => {
    const req = createRequest({ event: 'some.unknown.event', data: { id: 1 } });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.received).toBe(true);
  });

  describe('payment.captured', () => {
    test('should process successful payment capture', async () => {
      // Create pending payment
      const payment = await db.payment.create({
        data: {
          userId: testUser.id,
          amount: 10000,
          vatAmount: 1700,
          currency: 'ILS',
          status: 'PENDING',
          gatewayRef: 'test-gw-123',
        },
      });

      const req = createRequest({
        event: 'payment.captured',
        data: { gatewayRef: 'test-gw-123' },
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      // Verify payment updated
      const updatedPayment = await db.payment.findUnique({ where: { id: payment.id } });
      expect(updatedPayment?.status).toBe('COMPLETED');

      // Verify invoice created
      const invoice = await db.invoice.findFirst({ where: { paymentId: payment.id } });
      expect(invoice).toBeDefined();
      expect(invoice?.amount).toBe(10000);
      expect(invoice?.type).toBe('TAX_RECEIPT');
    });

    test('should activate subscription on capture', async () => {
      const sub = await db.subscription.create({
        data: {
          userId: testUser.id,
          planId: testPlan.id,
          status: 'EXPIRED',
        },
      });

      const payment = await db.payment.create({
        data: {
          userId: testUser.id,
          subscriptionId: sub.id,
          amount: 10000,
          vatAmount: 1700,
          status: 'PENDING',
          gatewayRef: 'gw-sub-1',
        },
      });

      const req = createRequest({
        event: 'payment.captured',
        data: { paymentId: payment.id }, // test matching by id
      });
      await POST(req);

      const updatedSub = await db.subscription.findUnique({ where: { id: sub.id } });
      expect(updatedSub?.status).toBe('ACTIVE');
    });
  });

  describe('payment.failed', () => {
    test('should update payment status to FAILED', async () => {
      const payment = await db.payment.create({
        data: {
          userId: testUser.id,
          amount: 5000,
          vatAmount: 850,
          status: 'PENDING',
          gatewayRef: 'gw-fail-1',
        },
      });

      const req = createRequest({
        event: 'payment.failed',
        data: { gatewayRef: 'gw-fail-1', reason: 'Declined' },
      });
      await POST(req);

      const updated = await db.payment.findUnique({ where: { id: payment.id } });
      expect(updated?.status).toBe('FAILED');
    });

    test('should update subscription to CANCELLED on failure', async () => {
      const sub = await db.subscription.create({
        data: {
          userId: testUser.id,
          planId: testPlan.id,
          status: 'ACTIVE',
        },
      });

      await db.payment.create({
        data: {
          userId: testUser.id,
          subscriptionId: sub.id,
          amount: 10000,
          vatAmount: 1700,
          status: 'PENDING',
          gatewayRef: 'gw-fail-2',
        },
      });

      const req = createRequest({
        event: 'payment.failed',
        data: { gatewayRef: 'gw-fail-2' },
      });
      await POST(req);

      const updatedSub = await db.subscription.findUnique({ where: { id: sub.id } });
      expect(updatedSub?.status).toBe('CANCELLED');
    });
  });

  describe('subscription.renewed', () => {
    test('should renew subscription and create payment/invoice', async () => {
      const endDate = new Date('2025-01-01T00:00:00Z');
      const sub = await db.subscription.create({
        data: {
          userId: testUser.id,
          planId: testPlan.id,
          status: 'ACTIVE',
          endDate,
        },
      });

      const req = createRequest({
        event: 'subscription.renewed',
        data: {
          subscriptionId: sub.id,
          gatewayRef: 'gw-renew-1',
          netAmount: 10000,
        },
      });
      await POST(req);

      // Verify subscription extended
      const updatedSub = await db.subscription.findUnique({ where: { id: sub.id } });

      // Should be exactly 1 year later
      expect(updatedSub?.endDate?.getFullYear()).toBe(endDate.getFullYear() + 1);

      // Verify new payment created
      const payment = await db.payment.findFirst({
        where: { subscriptionId: sub.id, gatewayRef: 'gw-renew-1' },
      });
      expect(payment).toBeDefined();
      expect(payment?.status).toBe('COMPLETED');
      expect(payment?.amount).toBe(10000);

      // Verify invoice created
      const invoice = await db.invoice.findFirst({ where: { paymentId: payment!.id } });
      expect(invoice).toBeDefined();
    });
  });
});
