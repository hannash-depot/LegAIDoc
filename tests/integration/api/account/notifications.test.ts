/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import { db } from '../../../../src/lib/db';
import { clearDbData, seedTestUserWithPassword } from '../../../test-utils';
import { NextRequest } from 'next/server';

let testUser: any;

vi.mock('@/auth', () => ({
  auth: vi.fn(async () => ({
    user: { id: '', email: '', role: 'USER' },
  })),
}));

const { auth } = await import('../../../../src/auth');
const { PUT } = await import('../../../../src/app/api/account/notifications/route');

describe('Notifications API (/api/account/notifications)', () => {
  beforeAll(async () => {
    await clearDbData();
    testUser = await seedTestUserWithPassword();
    vi.mocked(auth).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email, role: 'USER' },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
  });

  afterAll(async () => {
    await clearDbData();
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/account/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  test('should update notification preferences', async () => {
    const req = createRequest({
      emailNotifications: false,
      inAppNotifications: true,
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);

    const user = await db.user.findUnique({ where: { id: testUser.id } });
    const prefs = user!.notificationPrefs as any;
    expect(prefs.emailNotifications).toBe(false);
    expect(prefs.inAppNotifications).toBe(true);
  });

  test('should reject invalid schema', async () => {
    const req = createRequest({
      emailNotifications: 'yes',
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  test('should return 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any);
    const req = createRequest({
      emailNotifications: true,
      inAppNotifications: true,
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });
});
