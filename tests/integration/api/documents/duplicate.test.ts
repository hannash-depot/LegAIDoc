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
const { POST } = await import('../../../../src/app/api/documents/[id]/duplicate/route');

describe('Document Duplicate API (/api/documents/[id]/duplicate)', () => {
  beforeAll(async () => {
    await clearDbData();
    testUser = await seedTestUserWithPassword();
    otherUser = await db.user.create({
      data: { email: 'dup-other@example.com', name: 'Other', role: 'USER' },
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

  test('should duplicate document as DRAFT', async () => {
    setAuth(testUser);
    const doc = await seedDocument(testUser.id, testTemplate.id, {
      title: 'Original',
      status: 'PUBLISHED',
    });

    const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}/duplicate`, {
      method: 'POST',
    });
    const res = await POST(req, routeParams(doc.id));
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.data.title).toBe('Original (Copy)');
    expect(data.data.status).toBe('DRAFT');
    expect(data.data.id).not.toBe(doc.id);
    expect(data.data.templateId).toBe(doc.templateId);
  });

  test('should preserve wizard data in copy', async () => {
    setAuth(testUser);
    const doc = await seedDocument(testUser.id, testTemplate.id, {
      wizardData: { party_name: 'Copied User' },
    });

    const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}/duplicate`, {
      method: 'POST',
    });
    const res = await POST(req, routeParams(doc.id));
    expect(res.status).toBe(201);

    const data = await res.json();
    expect((data.data.wizardData as any).party_name).toBe('Copied User');
  });

  test('should return 403 for non-owner', async () => {
    setAuth(otherUser);
    const doc = await seedDocument(testUser.id, testTemplate.id);

    const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}/duplicate`, {
      method: 'POST',
    });
    const res = await POST(req, routeParams(doc.id));
    expect(res.status).toBe(403);
  });

  test('should return 404 for non-existent document', async () => {
    setAuth(testUser);
    const req = new NextRequest('http://localhost:3000/api/documents/fake/duplicate', {
      method: 'POST',
    });
    const res = await POST(req, routeParams('fake'));
    expect(res.status).toBe(404);
  });
});
