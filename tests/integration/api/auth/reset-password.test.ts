/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, afterAll } from 'vitest';
import { compareSync } from 'bcryptjs';
import { db } from '../../../../src/lib/db';
import { clearDbData, seedTestUserWithPassword } from '../../../test-utils';
import { createVerificationToken } from '../../../../src/lib/auth/tokens';
import { POST } from '../../../../src/app/api/auth/reset-password/route';
import { NextRequest } from 'next/server';

describe('Reset Password API (/api/auth/reset-password)', () => {
  let testUser: any;
  let validToken: string;

  beforeAll(async () => {
    await clearDbData();
    testUser = await seedTestUserWithPassword('OldPassword123');
    // Create a valid reset token (1 hour expiry)
    validToken = await createVerificationToken(testUser.email, 'pwd-reset', 60 * 60 * 1000);
  });

  afterAll(async () => {
    await clearDbData();
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  test('should reset password with valid token', async () => {
    const req = createRequest({
      token: validToken,
      email: testUser.email,
      password: 'NewPassword456',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify password was actually changed
    const updatedUser = await db.user.findUnique({ where: { email: testUser.email } });
    expect(compareSync('NewPassword456', updatedUser!.hashedPassword!)).toBe(true);
    expect(compareSync('OldPassword123', updatedUser!.hashedPassword!)).toBe(false);
  });

  test('should reject used token (single-use)', async () => {
    // The token from the previous test was already consumed
    const req = createRequest({
      token: validToken,
      email: testUser.email,
      password: 'AnotherPass789',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error.code).toBe('INVALID_TOKEN');
  });

  test('should reject invalid token', async () => {
    const req = createRequest({
      token: 'completely-invalid-token',
      email: testUser.email,
      password: 'ValidPass123',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error.code).toBe('INVALID_TOKEN');
  });

  test('should reject expired token', async () => {
    // Create a token that expires immediately (1ms)
    const expiredToken = await createVerificationToken(testUser.email, 'pwd-reset', 1);
    // Wait a bit for it to expire
    await new Promise((r) => setTimeout(r, 10));

    const req = createRequest({
      token: expiredToken,
      email: testUser.email,
      password: 'ValidPass123',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error.code).toBe('INVALID_TOKEN');
  });

  test('should reject short password', async () => {
    const newToken = await createVerificationToken(testUser.email, 'pwd-reset', 60 * 60 * 1000);
    const req = createRequest({
      token: newToken,
      email: testUser.email,
      password: 'short',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
