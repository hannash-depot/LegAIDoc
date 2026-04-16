/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import { db } from '../../../../src/lib/db';
import { clearDbData, seedTestUserWithPassword } from '../../../test-utils';
import { NextRequest } from 'next/server';

// Mock email sending
vi.mock('@/lib/email/send', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// Enable emails feature flag for token creation
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

const { POST } = await import('../../../../src/app/api/auth/forgot-password/route');

describe('Forgot Password API (/api/auth/forgot-password)', () => {
  let testUser: any;

  beforeAll(async () => {
    await clearDbData();
    testUser = await seedTestUserWithPassword('MyPassword123');
  });

  afterAll(async () => {
    await clearDbData();
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  test('should return 200 for existing user (anti-enumeration)', async () => {
    const req = createRequest({ email: testUser.email });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test('should return 200 for non-existent email (anti-enumeration)', async () => {
    const req = createRequest({ email: 'nobody@example.com' });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test('should create a verification token for existing user', async () => {
    const req = createRequest({ email: testUser.email });
    await POST(req);

    const token = await db.verificationToken.findFirst({
      where: { identifier: `pwd-reset:${testUser.email}` },
    });
    expect(token).toBeDefined();
    expect(token!.expires.getTime()).toBeGreaterThan(Date.now());
  });

  test('should not create token for non-existent user', async () => {
    await db.verificationToken.deleteMany({
      where: { identifier: 'pwd-reset:ghost@example.com' },
    });

    const req = createRequest({ email: 'ghost@example.com' });
    await POST(req);

    const token = await db.verificationToken.findFirst({
      where: { identifier: 'pwd-reset:ghost@example.com' },
    });
    expect(token).toBeNull();
  });

  test('should reject invalid email format', async () => {
    const req = createRequest({ email: 'not-valid' });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
