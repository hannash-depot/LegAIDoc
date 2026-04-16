/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, afterAll } from 'vitest';
import { db } from '../../../../src/lib/db';
import { clearDbData, seedTestUser } from '../../../test-utils';
import { createVerificationToken } from '../../../../src/lib/auth/tokens';
import { GET } from '../../../../src/app/api/auth/verify-email/route';
import { NextRequest } from 'next/server';

describe('Verify Email API (/api/auth/verify-email)', () => {
  let testUser: any;
  let validToken: string;

  beforeAll(async () => {
    await clearDbData();
    testUser = await seedTestUser();
    validToken = await createVerificationToken(testUser.email, 'email-verify', 60 * 60 * 1000);
  });

  afterAll(async () => {
    await clearDbData();
  });

  const createRequest = (token: string, email: string) => {
    return new NextRequest(
      `http://localhost:3000/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`,
      { method: 'GET' },
    );
  };

  test('should verify email with valid token', async () => {
    const req = createRequest(validToken, testUser.email);
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);

    // Check DB was updated
    const user = await db.user.findUnique({ where: { email: testUser.email } });
    expect(user!.emailVerified).toBeDefined();
    expect(user!.emailVerified).not.toBeNull();
  });

  test('should reject already-used token', async () => {
    const req = createRequest(validToken, testUser.email);
    const res = await GET(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error.code).toBe('INVALID_TOKEN');
  });

  test('should reject invalid token', async () => {
    const req = createRequest('bad-token', testUser.email);
    const res = await GET(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error.code).toBe('INVALID_TOKEN');
  });

  test('should reject missing token parameter', async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/auth/verify-email?email=${testUser.email}`,
      { method: 'GET' },
    );
    const res = await GET(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  test('should reject missing email parameter', async () => {
    const req = new NextRequest(`http://localhost:3000/api/auth/verify-email?token=sometoken`, {
      method: 'GET',
    });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
