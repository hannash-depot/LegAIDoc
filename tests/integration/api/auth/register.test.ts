/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import { db } from '../../../../src/lib/db';
import { clearDbData } from '../../../test-utils';
import { NextRequest } from 'next/server';

// Mock email sending so we don't need a real email service
vi.mock('@/lib/email/send', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// Bypass rate limiting in tests
vi.mock('@/lib/api/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 99, resetMs: 0 }),
  getEnvDefaults: vi
    .fn()
    .mockReturnValue({ windowMs: 60000, maxAuthenticated: 100, maxUnauthenticated: 20 }),
}));

// Import after mocks
const { POST } = await import('../../../../src/app/api/auth/register/route');

describe('Register API (/api/auth/register)', () => {
  beforeAll(async () => {
    await clearDbData();
  });

  afterAll(async () => {
    await clearDbData();
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  test('should register a new user with valid data', async () => {
    const req = createRequest({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'SecurePass123',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.email).toBe('jane@example.com');
    expect(data.data.name).toBe('Jane Doe');
    expect(data.data.role).toBe('USER');
    expect(data.data.preferredLocale).toBe('he');
    // Should not expose password
    expect(data.data.hashedPassword).toBeUndefined();
  });

  test('should hash the password (not store plaintext)', async () => {
    const user = await db.user.findUnique({ where: { email: 'jane@example.com' } });
    expect(user).toBeDefined();
    expect(user!.hashedPassword).toBeDefined();
    expect(user!.hashedPassword).not.toBe('SecurePass123');
    expect(user!.hashedPassword!.startsWith('$2')).toBe(true); // bcrypt hash prefix
  });

  test('should reject duplicate email with 409', async () => {
    const req = createRequest({
      name: 'Jane Clone',
      email: 'jane@example.com',
      password: 'AnotherPass123',
    });
    const res = await POST(req);
    expect(res.status).toBe(409);

    const data = await res.json();
    expect(data.error.code).toBe('EMAIL_EXISTS');
  });

  test('should reject invalid email format', async () => {
    const req = createRequest({
      name: 'Bad Email',
      email: 'not-an-email',
      password: 'ValidPass123',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  test('should reject short password', async () => {
    const req = createRequest({
      name: 'Short Pass',
      email: 'short@example.com',
      password: 'abc',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  test('should reject missing name', async () => {
    const req = createRequest({
      email: 'noname@example.com',
      password: 'ValidPass123',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('should reject short name', async () => {
    const req = createRequest({
      name: 'A',
      email: 'shortname@example.com',
      password: 'ValidPass123',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  test('should set default role to USER and locale to he', async () => {
    const req = createRequest({
      name: 'Default User',
      email: 'defaults@example.com',
      password: 'ValidPass123',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const user = await db.user.findUnique({ where: { email: 'defaults@example.com' } });
    expect(user!.role).toBe('USER');
    expect(user!.preferredLocale).toBe('he');
  });
});
