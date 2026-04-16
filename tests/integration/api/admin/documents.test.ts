/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import { db } from '../../../../src/lib/db';
import {
  clearDbData,
  seedTestAdmin,
  seedTestUserWithPassword,
  seedCategory,
  seedTemplate,
  seedDocument,
} from '../../../test-utils';
import { NextRequest } from 'next/server';

let adminUser: any;
let regularUser: any;
let category: any;
let template: any;

// Mock auth to return the admin session
vi.mock('@/auth', () => ({
  auth: vi.fn(async () => ({
    user: { id: '', email: '', role: 'ADMIN' },
  })),
}));

vi.mock('@/lib/audit/audit-trail', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

const { auth } = await import('../../../../src/auth');
const { GET } = await import('../../../../src/app/api/admin/documents/route');
const { GET: GET_BY_ID, DELETE } =
  await import('../../../../src/app/api/admin/documents/[id]/route');

describe('Admin Documents API (/api/admin/documents)', () => {
  beforeAll(async () => {
    await clearDbData();
    adminUser = await seedTestAdmin();
    regularUser = await seedTestUserWithPassword();
    category = await seedCategory();
    template = await seedTemplate(category.id);
    // Configure auth mock with real admin user
    vi.mocked(auth).mockResolvedValue({
      user: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
  });

  afterAll(async () => {
    await clearDbData();
  });

  describe('GET /api/admin/documents', () => {
    test('should list all documents with pagination', async () => {
      // Create documents for different users
      await seedDocument(adminUser.id, template.id, { title: 'Admin Doc' });
      await seedDocument(regularUser.id, template.id, { title: 'User Doc' });

      const req = new NextRequest('http://localhost:3000/api/admin/documents?page=1&pageSize=10');
      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.items).toBeInstanceOf(Array);
      expect(body.data.items.length).toBeGreaterThanOrEqual(2);
      expect(body.data.total).toBeGreaterThanOrEqual(2);
      expect(body.data.page).toBe(1);

      // Verify includes user and template relations
      const doc = body.data.items[0];
      expect(doc).toHaveProperty('user');
      expect(doc.user).toHaveProperty('email');
      expect(doc).toHaveProperty('template');
      expect(doc.template).toHaveProperty('category');
      expect(doc).toHaveProperty('_count');

      await db.document.deleteMany({});
    });

    test('should filter documents by status', async () => {
      await seedDocument(adminUser.id, template.id, { title: 'Draft Doc', status: 'DRAFT' });
      await seedDocument(adminUser.id, template.id, {
        title: 'Published Doc',
        status: 'PUBLISHED',
      });

      const req = new NextRequest('http://localhost:3000/api/admin/documents?status=DRAFT');
      const res = await GET(req);
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.data.items.every((d: any) => d.status === 'DRAFT')).toBe(true);

      await db.document.deleteMany({});
    });

    test('should search documents by title', async () => {
      await seedDocument(adminUser.id, template.id, { title: 'Rental Agreement' });
      await seedDocument(adminUser.id, template.id, { title: 'NDA Contract' });

      const req = new NextRequest('http://localhost:3000/api/admin/documents?search=Rental');
      const res = await GET(req);
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.data.items.length).toBe(1);
      expect(body.data.items[0].title).toBe('Rental Agreement');

      await db.document.deleteMany({});
    });

    test('should return 403 for non-admin', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: regularUser.id, email: regularUser.email, role: 'USER' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);
      const req = new NextRequest('http://localhost:3000/api/admin/documents');
      const res = await GET(req);
      expect(res.status).toBe(403);
    });

    test('should return 401 for unauthenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any);
      const req = new NextRequest('http://localhost:3000/api/admin/documents');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/admin/documents/[id]', () => {
    test('should return any user document as admin', async () => {
      // Create a document owned by the regular user
      const doc = await seedDocument(regularUser.id, template.id, { title: 'User Private Doc' });

      const req = new NextRequest(`http://localhost:3000/api/admin/documents/${doc.id}`);
      const res = await GET_BY_ID(req, { params: Promise.resolve({ id: doc.id }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(doc.id);
      expect(body.data.title).toBe('User Private Doc');
      // Admin can see the owner info
      expect(body.data.user.id).toBe(regularUser.id);
      expect(body.data).toHaveProperty('template');
      expect(body.data).toHaveProperty('signatories');

      await db.document.deleteMany({});
    });

    test('should return 404 for non-existent document', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/documents/non-existent');
      const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'non-existent' }) });
      expect(res.status).toBe(404);
    });

    test('should return 403 for non-admin', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: regularUser.id, email: regularUser.email, role: 'USER' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);
      const req = new NextRequest('http://localhost:3000/api/admin/documents/some-id');
      const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'some-id' }) });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/admin/documents/[id]', () => {
    test('should hard delete DRAFT document', async () => {
      const doc = await seedDocument(adminUser.id, template.id, {
        title: 'Draft to Delete',
        status: 'DRAFT',
      });

      const req = new NextRequest(`http://localhost:3000/api/admin/documents/${doc.id}`, {
        method: 'DELETE',
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: doc.id }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data.deleted).toBe(true);

      // Verify hard deleted
      const found = await db.document.findUnique({ where: { id: doc.id } });
      expect(found).toBeNull();
    });

    test('should archive non-DRAFT document instead of deleting', async () => {
      const doc = await seedDocument(adminUser.id, template.id, {
        title: 'Published to Archive',
        status: 'PUBLISHED',
      });

      const req = new NextRequest(`http://localhost:3000/api/admin/documents/${doc.id}`, {
        method: 'DELETE',
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: doc.id }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data.archived).toBe(true);

      // Verify archived, not deleted
      const found = await db.document.findUnique({ where: { id: doc.id } });
      expect(found).not.toBeNull();
      expect(found!.status).toBe('ARCHIVED');

      await db.document.deleteMany({});
    });

    test('should return 404 for non-existent document', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/documents/non-existent', {
        method: 'DELETE',
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: 'non-existent' }) });
      expect(res.status).toBe(404);
    });

    test('should return 403 for non-admin', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: regularUser.id, email: regularUser.email, role: 'USER' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);
      const req = new NextRequest('http://localhost:3000/api/admin/documents/some-id', {
        method: 'DELETE',
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: 'some-id' }) });
      expect(res.status).toBe(403);
    });
  });
});
