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
const { GET, PUT, DELETE } = await import('../../../../src/app/api/documents/[id]/route');

describe('Document CRUD API (/api/documents/[id])', () => {
  beforeAll(async () => {
    await clearDbData();
    testUser = await seedTestUserWithPassword();
    otherUser = await db.user.create({
      data: { email: 'other@example.com', name: 'Other User', role: 'USER' },
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

  describe('GET /api/documents/[id]', () => {
    test('should return document with template and signatories', async () => {
      setAuth(testUser);
      const doc = await seedDocument(testUser.id, testTemplate.id);

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}`, {
        method: 'GET',
      });
      const res = await GET(req, routeParams(doc.id));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.id).toBe(doc.id);
      expect(data.data.template).toBeDefined();
      expect(data.data.signatories).toBeDefined();
    });

    test('should return 404 for non-existent document', async () => {
      setAuth(testUser);
      const req = new NextRequest('http://localhost:3000/api/documents/fake', { method: 'GET' });
      const res = await GET(req, routeParams('fake'));
      expect(res.status).toBe(404);
    });

    test("should return 403 for another user's document", async () => {
      setAuth(otherUser);
      const doc = await seedDocument(testUser.id, testTemplate.id, { title: 'Private Doc' });

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}`, {
        method: 'GET',
      });
      const res = await GET(req, routeParams(doc.id));
      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/documents/[id]', () => {
    test('should update wizard data and re-render', async () => {
      setAuth(testUser);
      const doc = await seedDocument(testUser.id, testTemplate.id);

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wizardData: { party_name: 'Updated Name' } }),
      });
      const res = await PUT(req, routeParams(doc.id));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.renderedBody).toContain('Updated Name');
    });

    test('should reject editing non-DRAFT document', async () => {
      setAuth(testUser);
      const doc = await seedDocument(testUser.id, testTemplate.id, { status: 'PUBLISHED' });

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wizardData: { party_name: 'Test' } }),
      });
      const res = await PUT(req, routeParams(doc.id));
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error.code).toBe('NOT_DRAFT');
    });

    test("should return 403 for another user's document", async () => {
      setAuth(otherUser);
      const doc = await seedDocument(testUser.id, testTemplate.id);

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wizardData: { party_name: 'Hack' } }),
      });
      const res = await PUT(req, routeParams(doc.id));
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/documents/[id]', () => {
    test('should hard-delete DRAFT document', async () => {
      setAuth(testUser);
      const doc = await seedDocument(testUser.id, testTemplate.id);

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}`, {
        method: 'DELETE',
      });
      const res = await DELETE(req, routeParams(doc.id));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.deleted).toBe(true);

      const deleted = await db.document.findUnique({ where: { id: doc.id } });
      expect(deleted).toBeNull();
    });

    test('should archive PUBLISHED document', async () => {
      setAuth(testUser);
      const doc = await seedDocument(testUser.id, testTemplate.id, { status: 'PUBLISHED' });

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}`, {
        method: 'DELETE',
      });
      const res = await DELETE(req, routeParams(doc.id));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.archived).toBe(true);

      const updated = await db.document.findUnique({ where: { id: doc.id } });
      expect(updated!.status).toBe('ARCHIVED');
    });

    test('should reject deleting SIGNED document', async () => {
      setAuth(testUser);
      const doc = await seedDocument(testUser.id, testTemplate.id, { status: 'SIGNED' });

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}`, {
        method: 'DELETE',
      });
      const res = await DELETE(req, routeParams(doc.id));
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error.code).toBe('DOCUMENT_SIGNED');
    });

    test("should return 403 for another user's document", async () => {
      setAuth(otherUser);
      const doc = await seedDocument(testUser.id, testTemplate.id);

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}`, {
        method: 'DELETE',
      });
      const res = await DELETE(req, routeParams(doc.id));
      expect(res.status).toBe(403);
    });
  });
});
