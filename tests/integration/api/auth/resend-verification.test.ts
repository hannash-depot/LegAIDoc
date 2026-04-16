/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import { db } from '../../../../src/lib/db';
import { clearDbData, seedTestUser } from '../../../test-utils';
import { NextRequest } from 'next/server';

// Mock email sending
vi.mock('@/lib/email/send', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/feature-flags', () => ({
  FEATURE_EMAILS: true,
  FEATURE_PAYMENTS: false,
  FEATURE_ESIG: false,
  FEATURE_AI_IMPORT: false,
}));

// Bypass rate limiting in tests
vi.mock('@/lib/api/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 99, resetMs: 0 }),
  getEnvDefaults: vi
    .fn()
    .mockReturnValue({ windowMs: 60000, maxAuthenticated: 100, maxUnauthenticated: 20 }),
}));

const { POST } = await import('../../../../src/app/api/auth/resend-verification/route');

describe('Resend Verification API (/api/auth/resend-verification)', () => {
  let testUser: any;

  beforeAll(async () => {
    await clearDbData();
    // Create an unverified user
    testUser = await seedTestUser();
  });

  afterAll(async () => {
    await clearDbData();
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  test('should return success for unverified user and create token', async () => {
    const req = createRequest({ email: testUser.email });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify token was created
    const token = await db.verificationToken.findFirst({
      where: { identifier: `email-verify:${testUser.email}` },
    });
    expect(token).toBeDefined();
  });

  test('should return success for non-existent email (anti-enumeration)', async () => {
    const req = createRequest({ email: 'nobody@example.com' });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test('should reject invalid email format', async () => {
    const req = createRequest({ email: 'invalid' });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
