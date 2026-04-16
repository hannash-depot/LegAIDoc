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
let category: any;

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
const { GET, POST } = await import('../../../../src/app/api/admin/templates/route');
const { PUT, DELETE } = await import('../../../../src/app/api/admin/templates/[id]/route');

const validDefinition = {
  version: 1,
  steps: [
    {
      key: 'step1',
      title: { he: 'שלב 1', ar: 'خطوة 1', en: 'Step 1', ru: 'Шаг 1' },
      fields: [
        {
          key: 'party_name',
          type: 'text',
          label: { he: 'שם', ar: 'اسم', en: 'Name', ru: 'Имя' },
          required: true,
        },
      ],
    },
  ],
  documentBody: {
    he: '<p>חוזה עבור {{party_name}}</p>',
    ar: '<p>عقد ل{{party_name}}</p>',
    en: '<p>Contract for {{party_name}}</p>',
    ru: '<p>Контракт для {{party_name}}</p>',
  },
};

describe('Admin Templates API (/api/admin/templates)', () => {
  beforeAll(async () => {
    await clearDbData();
    adminUser = await seedTestAdmin();
    regularUser = await seedTestUserWithPassword();
    category = await seedCategory();
    // Configure auth mock with real admin user
    vi.mocked(auth).mockResolvedValue({
      user: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
  });

  afterAll(async () => {
    await clearDbData();
  });

  describe('GET /api/admin/templates', () => {
    test('should list templates with pagination', async () => {
      // Seed a template
      await seedTemplate(category.id);

      const req = new NextRequest('http://localhost:3000/api/admin/templates?page=1&pageSize=10');
      const res = await GET(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.items).toBeInstanceOf(Array);
      expect(body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(body.data.total).toBeGreaterThanOrEqual(1);
      expect(body.data.page).toBe(1);

      // Verify includes category
      const tmpl = body.data.items[0];
      expect(tmpl).toHaveProperty('category');
      expect(tmpl).toHaveProperty('_count');

      // Clean up for other tests
      await db.template.deleteMany({});
    });

    test('should filter templates by status=active', async () => {
      await seedTemplate(category.id, { slug: 'active-tmpl', isActive: true });
      await seedTemplate(category.id, { slug: 'inactive-tmpl', isActive: false });

      const req = new NextRequest('http://localhost:3000/api/admin/templates?status=active');
      const res = await GET(req);
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.data.items.every((t: any) => t.isActive === true)).toBe(true);

      await db.template.deleteMany({});
    });

    test('should return 403 for non-admin', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: regularUser.id, email: regularUser.email, role: 'USER' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);
      const req = new NextRequest('http://localhost:3000/api/admin/templates');
      const res = await GET(req);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/admin/templates', () => {
    test('should create template with valid definition', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'new-template',
          nameHe: 'תבנית חדשה',
          nameAr: 'قالب جديد',
          nameEn: 'New Template',
          nameRu: 'Новый шаблон',
          categoryId: category.id,
          definition: validDefinition,
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(201);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.slug).toBe('new-template');
      expect(body.data.nameEn).toBe('New Template');

      // Clean up
      await db.template.deleteMany({});
    });

    test('should reject duplicate slug', async () => {
      await seedTemplate(category.id, { slug: 'dup-slug' });

      const req = new NextRequest('http://localhost:3000/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'dup-slug',
          nameHe: 'כפילות',
          nameAr: 'تكرار',
          nameEn: 'Duplicate',
          nameRu: 'Дубликат',
          categoryId: category.id,
          definition: validDefinition,
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(409);

      await db.template.deleteMany({});
    });

    test('should return 400 for invalid body', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: 'x' }), // missing required fields
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    test('should return 404 for non-existent category', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: 'orphan-template',
          nameHe: 'יתום',
          nameAr: 'يتيم',
          nameEn: 'Orphan',
          nameRu: 'Сирота',
          categoryId: 'non-existent-id',
          definition: validDefinition,
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(404);
    });

    test('should return 403 for non-admin', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: regularUser.id, email: regularUser.email, role: 'USER' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);
      const req = new NextRequest('http://localhost:3000/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/admin/templates/[id]', () => {
    test('should update template name', async () => {
      const template = await seedTemplate(category.id);

      const req = new NextRequest(`http://localhost:3000/api/admin/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameEn: 'Updated Template' }),
      });
      const res = await PUT(req, { params: Promise.resolve({ id: template.id }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.nameEn).toBe('Updated Template');

      await db.template.deleteMany({});
    });

    test('should auto-increment version on definition change', async () => {
      const template = await seedTemplate(category.id);
      const originalVersion = template.version;

      const updatedDefinition = {
        ...validDefinition,
        steps: [
          {
            ...validDefinition.steps[0],
            fields: [
              ...validDefinition.steps[0].fields,
              {
                key: 'extra_field',
                type: 'text',
                label: { he: 'שדה', ar: 'حقل', en: 'Field', ru: 'Поле' },
                required: false,
              },
            ],
          },
        ],
      };

      const req = new NextRequest(`http://localhost:3000/api/admin/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ definition: updatedDefinition }),
      });
      const res = await PUT(req, { params: Promise.resolve({ id: template.id }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data.version).toBe(originalVersion + 1);

      // Verify snapshot was created
      const snapshots = await db.templateSnapshot.findMany({
        where: { templateId: template.id },
      });
      expect(snapshots.length).toBe(1);
      expect(snapshots[0].version).toBe(originalVersion);

      await db.templateSnapshot.deleteMany({});
      await db.template.deleteMany({});
    });

    test('should return 404 for non-existent template', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/templates/non-existent', {
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
      const req = new NextRequest('http://localhost:3000/api/admin/templates/some-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await PUT(req, { params: Promise.resolve({ id: 'some-id' }) });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/admin/templates/[id]', () => {
    test('should hard delete template with no documents', async () => {
      const template = await seedTemplate(category.id);

      const req = new NextRequest(`http://localhost:3000/api/admin/templates/${template.id}`, {
        method: 'DELETE',
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: template.id }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data.deleted).toBe(true);

      // Verify hard deleted
      const found = await db.template.findUnique({ where: { id: template.id } });
      expect(found).toBeNull();
    });

    test('should soft delete template with existing documents', async () => {
      const template = await seedTemplate(category.id, { slug: 'with-docs' });
      // Create a document referencing this template
      await db.document.create({
        data: {
          title: 'Test Doc',
          userId: adminUser.id,
          templateId: template.id,
          templateVersion: 1,
          wizardData: { party_name: 'Test' },
          renderedBody: '<p>Test</p>',
          status: 'DRAFT',
          locale: 'en',
        },
      });

      const req = new NextRequest(`http://localhost:3000/api/admin/templates/${template.id}`, {
        method: 'DELETE',
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: template.id }) });
      expect(res.status).toBe(200);

      // Verify soft deleted (isActive = false)
      const found = await db.template.findUnique({ where: { id: template.id } });
      expect(found).not.toBeNull();
      expect(found!.isActive).toBe(false);

      // Clean up
      await db.document.deleteMany({});
      await db.template.deleteMany({});
    });

    test('should return 404 for non-existent template', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/templates/non-existent', {
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
      const req = new NextRequest('http://localhost:3000/api/admin/templates/some-id', {
        method: 'DELETE',
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: 'some-id' }) });
      expect(res.status).toBe(403);
    });
  });
});
