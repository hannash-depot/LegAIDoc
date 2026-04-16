/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import {
  clearDbData,
  seedTestUserWithPassword,
  seedCategory,
  seedTemplate,
} from '../../../test-utils';
import { NextRequest } from 'next/server';

let testUser: any;
let testTemplate: any;

vi.mock('@/auth', () => ({
  auth: vi.fn(async () => null),
}));

vi.mock('@/lib/audit/audit-trail', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/feature-flags', () => ({
  FEATURE_PAYMENTS: false,
  FEATURE_ESIG: false,
  FEATURE_EMAILS: false,
  FEATURE_AI_IMPORT: false,
}));

const { auth } = await import('../../../../src/auth');
const { POST } = await import('../../../../src/app/api/documents/route');

describe('Create Document API (/api/documents)', () => {
  beforeAll(async () => {
    await clearDbData();
    testUser = await seedTestUserWithPassword();
    const category = await seedCategory();
    testTemplate = await seedTemplate(category.id);

    vi.mocked(auth).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email, role: 'USER' },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
  });

  afterAll(async () => {
    await clearDbData();
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  test('should create a document with valid data', async () => {
    const req = createRequest({
      templateId: testTemplate.id,
      wizardData: { party_name: 'Alice' },
      locale: 'en',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('DRAFT');
    expect(data.data.templateId).toBe(testTemplate.id);
    expect(data.data.renderedBody).toContain('Alice');
  });

  test('should render template with wizard data', async () => {
    const req = createRequest({
      templateId: testTemplate.id,
      wizardData: { party_name: 'Bob Smith' },
      locale: 'he',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.data.renderedBody).toContain('Bob Smith');
  });

  test('should return 404 for non-existent template', async () => {
    const req = createRequest({
      templateId: 'nonexistent-id',
      wizardData: { party_name: 'Test' },
    });
    const res = await POST(req);
    expect(res.status).toBe(404);

    const data = await res.json();
    expect(data.error.code).toBe('TEMPLATE_NOT_FOUND');
  });

  test('should return 404 for inactive template', async () => {
    const category = await seedCategory({ slug: 'inactive-cat' });
    const inactiveTemplate = await seedTemplate(category.id, {
      slug: 'inactive-template',
      isActive: false,
    });

    const req = createRequest({
      templateId: inactiveTemplate.id,
      wizardData: { party_name: 'Test' },
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  test('should reject missing templateId', async () => {
    const req = createRequest({
      wizardData: { party_name: 'Test' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('should return 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any);
    const req = createRequest({
      templateId: testTemplate.id,
      wizardData: {},
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
