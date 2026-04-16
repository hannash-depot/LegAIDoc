/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import { db } from '../../../../src/lib/db';
import { clearDbData, seedTestUserWithPassword } from '../../../test-utils';
import { NextRequest } from 'next/server';

let testUser: any;

// Mock auth to return the test user session
vi.mock('@/auth', () => ({
  auth: vi.fn(async () => ({
    user: { id: '', email: '', role: 'USER' },
  })),
}));

vi.mock('@/lib/audit/audit-trail', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

const { auth } = await import('../../../../src/auth');
const { PUT } = await import('../../../../src/app/api/account/profile/route');

describe('Profile API (/api/account/profile)', () => {
  beforeAll(async () => {
    await clearDbData();
    testUser = await seedTestUserWithPassword();
    // Configure auth mock with the real user ID
    vi.mocked(auth).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email, role: 'USER' },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
  });

  afterAll(async () => {
    await clearDbData();
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/account/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  test('should update name and locale', async () => {
    const req = createRequest({
      name: 'Updated Name',
      preferredLocale: 'ar',
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);

    const user = await db.user.findUnique({ where: { id: testUser.id } });
    expect(user!.name).toBe('Updated Name');
    expect(user!.preferredLocale).toBe('ar');
  });

  test('should update B2B fields', async () => {
    const req = createRequest({
      name: 'Business User',
      preferredLocale: 'he',
      companyName: 'Acme Ltd',
      idNumber: '123456789',
      address: '123 Main St',
      phone: '+972501234567',
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);

    const user = await db.user.findUnique({ where: { id: testUser.id } });
    expect(user!.companyName).toBe('Acme Ltd');
    expect(user!.idNumber).toBe('123456789');
  });

  test('should reject invalid locale', async () => {
    const req = createRequest({
      name: 'Test',
      preferredLocale: 'fr',
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  test('should reject short name', async () => {
    const req = createRequest({
      name: 'A',
      preferredLocale: 'he',
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  test('should return 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any);
    const req = createRequest({
      name: 'Test',
      preferredLocale: 'he',
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });
});
