/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import { db } from '../../../../src/lib/db';
import {
  clearDbData,
  seedTestAdmin,
  seedTestUserWithPassword,
  seedCategory,
  seedTemplate,
} from '../../../test-utils';
import { NextRequest } from 'next/server';

let adminUser: any;
let regularUser: any;

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
const { GET, POST } = await import('../../../../src/app/api/admin/categories/route');
const {
  GET: GET_BY_ID,
  PUT,
  DELETE,
} = await import('../../../../src/app/api/admin/categories/[id]/route');

describe('Admin Categories API (/api/admin/categories)', () => {
  beforeAll(async () => {
    await clearDbData();
    adminUser = await seedTestAdmin();
    regularUser = await seedTestUserWithPassword();
    // Configure auth mock with real admin user
    vi.mocked(auth).mockResolvedValue({
      user: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
  });

  afterAll(async () => {
    await clearDbData();
  });

  describe('GET /api/admin/categories', () => {
    test('should list categories ordered by sortOrder', async () => {
      await seedCategory({ slug: 'cat-b', sortOrder: 2 });
      await seedCategory({ slug: 'cat-a', sortOrder: 1 });

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBeGreaterThanOrEqual(2);

      // Verify ordering by sortOrder ascending
      expect(body.data[0].sortOrder).toBeLessThanOrEqual(body.data[1].sortOrder);

      // Verify includes template count
      expect(body.data[0]).toHaveProperty('_count');

      await db.category.deleteMany({});
    });

    test('should return 403 for non-admin', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: regularUser.id, email: regularUser.email, role: 'USER' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);
      const res = await GET();
      expect(res.status).toBe(403);
    });

    test('should return 401 for unauthenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any);
      const res = await GET();
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/admin/categories', () => {
    test('should create category with valid data', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'new-category',
          nameHe: 'קטגוריה חדשה',
          nameAr: 'فئة جديدة',
          nameEn: 'New Category',
          nameRu: 'Новая категория',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(201);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.slug).toBe('new-category');
      expect(body.data.nameEn).toBe('New Category');

      await db.category.deleteMany({});
    });

    test('should reject duplicate slug', async () => {
      await seedCategory({ slug: 'dup-cat' });

      const req = new NextRequest('http://localhost:3000/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'dup-cat',
          nameHe: 'כפילות',
          nameAr: 'تكرار',
          nameEn: 'Duplicate',
          nameRu: 'Дубликат',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(409);

      await db.category.deleteMany({});
    });

    test('should return 400 for invalid body', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: 'x' }), // too short + missing names
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    test('should return 403 for non-admin', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: regularUser.id, email: regularUser.email, role: 'USER' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);
      const req = new NextRequest('http://localhost:3000/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/categories/[id]', () => {
    test('should return single category by id', async () => {
      const cat = await seedCategory();

      const req = new NextRequest(`http://localhost:3000/api/admin/categories/${cat.id}`);
      const res = await GET_BY_ID(req, { params: Promise.resolve({ id: cat.id }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(cat.id);
      expect(body.data).toHaveProperty('_count');

      await db.category.deleteMany({});
    });

    test('should return 404 for non-existent category', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/categories/non-existent');
      const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'non-existent' }) });
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/admin/categories/[id]', () => {
    test('should update category', async () => {
      const cat = await seedCategory();

      const req = new NextRequest(`http://localhost:3000/api/admin/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameEn: 'Updated Category' }),
      });
      const res = await PUT(req, { params: Promise.resolve({ id: cat.id }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.nameEn).toBe('Updated Category');

      await db.category.deleteMany({});
    });

    test('should reject slug collision on update', async () => {
      await seedCategory({ slug: 'cat-one' });
      const cat2 = await seedCategory({ slug: 'cat-two' });

      const req = new NextRequest(`http://localhost:3000/api/admin/categories/${cat2.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: 'cat-one' }),
      });
      const res = await PUT(req, { params: Promise.resolve({ id: cat2.id }) });
      expect(res.status).toBe(409);

      await db.category.deleteMany({});
    });

    test('should return 404 for non-existent category', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/categories/non-existent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameEn: 'X' }),
      });
      const res = await PUT(req, { params: Promise.resolve({ id: 'non-existent' }) });
      expect(res.status).toBe(404);
    });

    test('should return 403 for non-admin', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: regularUser.id, email: regularUser.email, role: 'USER' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);
      const req = new NextRequest('http://localhost:3000/api/admin/categories/some-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await PUT(req, { params: Promise.resolve({ id: 'some-id' }) });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/admin/categories/[id]', () => {
    test('should hard delete category with no templates', async () => {
      const cat = await seedCategory();

      const req = new NextRequest(`http://localhost:3000/api/admin/categories/${cat.id}`, {
        method: 'DELETE',
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: cat.id }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data.deleted).toBe(true);

      // Verify hard deleted
      const found = await db.category.findUnique({ where: { id: cat.id } });
      expect(found).toBeNull();
    });

    test('should soft delete category with existing templates', async () => {
      const cat = await seedCategory({ slug: 'cat-with-templates' });
      await seedTemplate(cat.id);

      const req = new NextRequest(`http://localhost:3000/api/admin/categories/${cat.id}`, {
        method: 'DELETE',
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: cat.id }) });
      expect(res.status).toBe(200);

      // Verify soft deleted (isActive = false)
      const found = await db.category.findUnique({ where: { id: cat.id } });
      expect(found).not.toBeNull();
      expect(found!.isActive).toBe(false);

      // Clean up
      await db.template.deleteMany({});
      await db.category.deleteMany({});
    });

    test('should return 404 for non-existent category', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/categories/non-existent', {
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
      const req = new NextRequest('http://localhost:3000/api/admin/categories/some-id', {
        method: 'DELETE',
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: 'some-id' }) });
      expect(res.status).toBe(403);
    });
  });
});
