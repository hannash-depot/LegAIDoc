/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import { db } from '../../../../src/lib/db';
import { clearDbData, seedTestUser } from '../../../test-utils';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({
  auth: vi.fn(async () => null),
}));

const { auth } = await import('../../../../src/auth');
const { GET: listNotifications } = await import('../../../../src/app/api/notifications/route');
const { GET: unreadCount } =
  await import('../../../../src/app/api/notifications/unread-count/route');
const { PATCH: markRead } = await import('../../../../src/app/api/notifications/[id]/read/route');
const { PATCH: markAllRead } = await import('../../../../src/app/api/notifications/read-all/route');

let testUser: any;
let otherUser: any;

const setAuth = (user: any) => {
  vi.mocked(auth).mockResolvedValue({
    user: { id: user.id, email: user.email, role: user.role },
    expires: new Date(Date.now() + 86400000).toISOString(),
  } as any);
};

const clearAuth = () => {
  vi.mocked(auth).mockResolvedValue(null as any);
};

describe('Notifications API', () => {
  beforeAll(async () => {
    await clearDbData();
    testUser = await seedTestUser();
    otherUser = await db.user.create({
      data: { email: 'other@example.com', name: 'Other User', role: 'USER' },
    });

    // Seed notifications for testUser
    await db.notification.createMany({
      data: [
        {
          userId: testUser.id,
          type: 'SIGNATURE_REQUESTED',
          titleKey: 'notifications.signatureRequested.title',
          bodyKey: 'notifications.signatureRequested.body',
          params: { documentTitle: 'Contract A' },
          link: '/documents/doc-1',
          read: false,
        },
        {
          userId: testUser.id,
          type: 'DOCUMENT_COMMENT',
          titleKey: 'notifications.documentComment.title',
          bodyKey: 'notifications.documentComment.body',
          params: { documentTitle: 'Contract B', authorName: 'Alice' },
          link: '/documents/doc-2',
          read: true,
        },
        {
          userId: otherUser.id,
          type: 'ANALYSIS_COMPLETE',
          titleKey: 'notifications.analysisComplete.title',
          bodyKey: 'notifications.analysisComplete.body',
          params: { contractTitle: 'Other Contract' },
          read: false,
        },
      ],
    });
  });

  afterAll(async () => {
    await clearDbData();
  });

  describe('GET /api/notifications', () => {
    test('returns 401 when not authenticated', async () => {
      clearAuth();
      const req = new NextRequest('http://localhost:3000/api/notifications');
      const res = await listNotifications(req);
      expect(res.status).toBe(401);
    });

    test('returns only the authenticated user notifications', async () => {
      setAuth(testUser);
      const req = new NextRequest('http://localhost:3000/api/notifications');
      const res = await listNotifications(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.notifications).toHaveLength(2);
      expect(data.data.pagination.total).toBe(2);
    });

    test('filters by read status', async () => {
      setAuth(testUser);
      const req = new NextRequest('http://localhost:3000/api/notifications?read=false');
      const res = await listNotifications(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.notifications).toHaveLength(1);
      expect(data.data.notifications[0].type).toBe('SIGNATURE_REQUESTED');
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    test('returns 401 when not authenticated', async () => {
      clearAuth();
      const res = await unreadCount();
      expect(res.status).toBe(401);
    });

    test('returns correct unread count', async () => {
      setAuth(testUser);
      const res = await unreadCount();
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.count).toBe(1);
    });
  });

  describe('PATCH /api/notifications/[id]/read', () => {
    test('returns 401 when not authenticated', async () => {
      clearAuth();
      const req = new NextRequest('http://localhost:3000/api/notifications/fake/read', {
        method: 'PATCH',
      });
      const res = await markRead(req, { params: Promise.resolve({ id: 'fake' }) });
      expect(res.status).toBe(401);
    });

    test('returns 404 for another user notification', async () => {
      setAuth(testUser);
      const otherNotification = await db.notification.findFirst({
        where: { userId: otherUser.id },
      });
      const req = new NextRequest(
        `http://localhost:3000/api/notifications/${otherNotification!.id}/read`,
        { method: 'PATCH' },
      );
      const res = await markRead(req, { params: Promise.resolve({ id: otherNotification!.id }) });
      expect(res.status).toBe(404);
    });

    test('marks notification as read', async () => {
      setAuth(testUser);
      const notification = await db.notification.findFirst({
        where: { userId: testUser.id, read: false },
      });

      const req = new NextRequest(
        `http://localhost:3000/api/notifications/${notification!.id}/read`,
        { method: 'PATCH' },
      );
      const res = await markRead(req, { params: Promise.resolve({ id: notification!.id }) });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.updated).toBe(true);

      // Verify in DB
      const updated = await db.notification.findUnique({ where: { id: notification!.id } });
      expect(updated!.read).toBe(true);
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    test('returns 401 when not authenticated', async () => {
      clearAuth();
      const res = await markAllRead();
      expect(res.status).toBe(401);
    });

    test('marks all user notifications as read', async () => {
      // Reset one notification to unread for this test
      const notification = await db.notification.findFirst({ where: { userId: testUser.id } });
      await db.notification.update({ where: { id: notification!.id }, data: { read: false } });

      setAuth(testUser);
      const res = await markAllRead();
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.updated).toBeGreaterThanOrEqual(1);

      // Verify all are read
      const unread = await db.notification.count({ where: { userId: testUser.id, read: false } });
      expect(unread).toBe(0);

      // Other user's notification should still be unread
      const otherUnread = await db.notification.count({
        where: { userId: otherUser.id, read: false },
      });
      expect(otherUnread).toBe(1);
    });
  });
});
