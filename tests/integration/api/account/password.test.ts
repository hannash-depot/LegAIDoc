/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import { compareSync } from 'bcryptjs';
import { db } from '../../../../src/lib/db';
import { clearDbData, seedTestUserWithPassword } from '../../../test-utils';
import { NextRequest } from 'next/server';

const TEST_PASSWORD = 'OldPassword123';
let testUser: any;

vi.mock('@/auth', () => ({
  auth: vi.fn(async () => ({
    user: { id: '', email: '', role: 'USER' },
  })),
}));

vi.mock('@/lib/audit/audit-trail', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

const { auth } = await import('../../../../src/auth');
const { PUT } = await import('../../../../src/app/api/account/password/route');

describe('Password Change API (/api/account/password)', () => {
  beforeAll(async () => {
    await clearDbData();
    testUser = await seedTestUserWithPassword(TEST_PASSWORD);
    vi.mocked(auth).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email, role: 'USER' },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
  });

  afterAll(async () => {
    await clearDbData();
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/account/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  test('should change password with correct current password', async () => {
    const req = createRequest({
      currentPassword: TEST_PASSWORD,
      newPassword: 'NewPassword456',
      confirmPassword: 'NewPassword456',
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);

    const user = await db.user.findUnique({ where: { id: testUser.id } });
    expect(compareSync('NewPassword456', user!.hashedPassword!)).toBe(true);
  }, 15000); // bcrypt cost-12 compare + hash can exceed default 5s timeout under load

  test('should reject wrong current password', async () => {
    const req = createRequest({
      currentPassword: 'WrongPassword',
      newPassword: 'Another123',
      confirmPassword: 'Another123',
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error.code).toBe('INVALID_PASSWORD');
  });

  test('should reject mismatched passwords', async () => {
    const req = createRequest({
      currentPassword: 'NewPassword456',
      newPassword: 'Password111',
      confirmPassword: 'Password222',
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  test('should return 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any);
    const req = createRequest({
      currentPassword: 'test',
      newPassword: 'NewPass123',
      confirmPassword: 'NewPass123',
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });
});
