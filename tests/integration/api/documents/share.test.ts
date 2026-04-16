/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import { db } from '../../../../src/lib/db';
import {
  clearDbData,
  seedTestUserWithPassword,
  seedCategory,
  seedTemplate,
  seedDocument,
} from '../../../test-utils';
import { NextRequest } from 'next/server';

let testUser: any;
let otherUser: any;
let testTemplate: any;

vi.mock('@/auth', () => ({
  auth: vi.fn(async () => null),
}));

vi.mock('@/lib/audit/audit-trail', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

const { auth } = await import('../../../../src/auth');
const { POST, GET } = await import('../../../../src/app/api/documents/[id]/share/route');

describe('Document Share API (/api/documents/[id]/share)', () => {
  beforeAll(async () => {
    await clearDbData();
    testUser = await seedTestUserWithPassword();
    otherUser = await db.user.create({
      data: { email: 'other-share@example.com', name: 'Other', role: 'USER' },
    });
    const category = await seedCategory();
    testTemplate = await seedTemplate(category.id);
  });

  afterAll(async () => {
    await clearDbData();
  });

  const setAuth = (user: any) => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: user.id, email: user.email, role: user.role },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
  };

  const routeParams = (id: string) => ({ params: Promise.resolve({ id }) });

  describe('POST /api/documents/[id]/share', () => {
    test('should create share link with VIEW permission by default', async () => {
      setAuth(testUser);
      const doc = await seedDocument(testUser.id, testTemplate.id);

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await POST(req, routeParams(doc.id));
      expect(res.status).toBe(201);

      const data = await res.json();
      expect(data.data.token).toBeDefined();
      expect(data.data.expiresAt).toBeDefined();

      // Verify in DB
      const share = await db.documentShare.findFirst({ where: { documentId: doc.id } });
      expect(share!.permission).toBe('VIEW');
    });

    test('should create share link with COMMENT permission', async () => {
      setAuth(testUser);
      const doc = await seedDocument(testUser.id, testTemplate.id, { title: 'Comment Share' });

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission: 'COMMENT' }),
      });
      const res = await POST(req, routeParams(doc.id));
      expect(res.status).toBe(201);

      const share = await db.documentShare.findFirst({
        where: { documentId: doc.id },
        orderBy: { createdAt: 'desc' },
      });
      expect(share!.permission).toBe('COMMENT');
    });

    test('should reject sharing archived document', async () => {
      setAuth(testUser);
      const doc = await seedDocument(testUser.id, testTemplate.id, { status: 'ARCHIVED' });

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await POST(req, routeParams(doc.id));
      expect(res.status).toBe(400);
    });

    test('should return 403 for non-owner', async () => {
      setAuth(otherUser);
      const doc = await seedDocument(testUser.id, testTemplate.id);

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await POST(req, routeParams(doc.id));
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/documents/[id]/share', () => {
    test('should list active share links', async () => {
      setAuth(testUser);
      const doc = await seedDocument(testUser.id, testTemplate.id, { title: 'List Shares' });

      // Create a share
      await db.documentShare.create({
        data: {
          documentId: doc.id,
          createdBy: testUser.id,
          expiresAt: new Date(Date.now() + 86400000),
          permission: 'VIEW',
        },
      });

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}/share`, {
        method: 'GET',
      });
      const res = await GET(req, routeParams(doc.id));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.length).toBeGreaterThan(0);
    });

    test('should return 403 for non-owner', async () => {
      setAuth(otherUser);
      const doc = await seedDocument(testUser.id, testTemplate.id);

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}/share`, {
        method: 'GET',
      });
      const res = await GET(req, routeParams(doc.id));
      expect(res.status).toBe(403);
    });
  });
});
