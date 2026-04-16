/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import { db } from '../../../../src/lib/db';
import { clearDbData, seedTestUserWithPassword } from '../../../test-utils';
import { NextRequest } from 'next/server';

const TEST_PASSWORD = 'DeleteMe123';
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
const { DELETE } = await import('../../../../src/app/api/account/delete/route');

describe('Account Delete API (/api/account/delete)', () => {
  beforeAll(async () => {
    await clearDbData();
  });

  afterAll(async () => {
    await clearDbData();
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/account/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  test('should reject wrong password', async () => {
    testUser = await seedTestUserWithPassword(TEST_PASSWORD);
    vi.mocked(auth).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email, role: 'USER' },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);

    const req = createRequest({
      password: 'WrongPassword',
      confirmation: 'DELETE',
    });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  test('should reject without DELETE confirmation', async () => {
    const req = createRequest({
      password: TEST_PASSWORD,
      confirmation: 'NOPE',
    });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  test('should delete user and cascade data', async () => {
    const req = createRequest({
      password: TEST_PASSWORD,
      confirmation: 'DELETE',
    });
    const res = await DELETE(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.data.deleted).toBe(true);

    // Verify user is gone
    const user = await db.user.findUnique({ where: { id: testUser.id } });
    expect(user).toBeNull();
  });

  test('should return 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any);
    const req = createRequest({
      password: 'test',
      confirmation: 'DELETE',
    });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });
});
