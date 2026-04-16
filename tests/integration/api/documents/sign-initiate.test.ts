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
let testCategory: any;
let testTemplate: any;
let wetInkCategory: any;
let wetInkTemplate: any;

vi.mock('@/auth', () => ({
  auth: vi.fn(async () => null),
}));

vi.mock('@/lib/audit/audit-trail', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/feature-flags', () => ({
  FEATURE_ESIG: true,
  FEATURE_EMAILS: false,
  FEATURE_NOTIFICATIONS: false,
  FEATURE_PAYMENTS: false,
  FEATURE_AI_IMPORT: false,
}));

vi.mock('@/lib/email/send', () => ({
  sendSignatureRequestEmail: vi.fn().mockResolvedValue(undefined),
}));

const { auth } = await import('../../../../src/auth');
const { POST } = await import('../../../../src/app/api/documents/[id]/sign/initiate/route');

describe('Sign Initiate API (POST /api/documents/[id]/sign/initiate)', () => {
  beforeAll(async () => {
    await clearDbData();
    testUser = await seedTestUserWithPassword();
    otherUser = await db.user.create({
      data: { email: 'other-sign@example.com', name: 'Other User', role: 'USER' },
    });

    testCategory = await seedCategory({ requiresWetInk: false });
    testTemplate = await seedTemplate(testCategory.id);

    wetInkCategory = await seedCategory({
      slug: 'wet-ink-category',
      nameEn: 'Wet Ink Category',
      requiresWetInk: true,
    });
    wetInkTemplate = await seedTemplate(wetInkCategory.id, {
      slug: 'wet-ink-template',
    });
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

  const validSignatories = [
    { name: 'Alice', email: 'alice@example.com', role: 'INITIATOR' },
    { name: 'Bob', email: 'bob@example.com', role: 'COUNTER_PARTY' },
  ];

  const createRequest = (docId: string, body: any) =>
    new NextRequest(`http://localhost:3000/api/documents/${docId}/sign/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  test('should transition DRAFT to PENDING_SIGNATURE, create signatories, and hash document', async () => {
    setAuth(testUser);
    const doc = await seedDocument(testUser.id, testTemplate.id);

    const req = createRequest(doc.id, { signatories: validSignatories });
    const res = await POST(req, routeParams(doc.id));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('PENDING_SIGNATURE');
    expect(data.data.signatories).toHaveLength(2);
    expect(data.data.signatories[0].name).toBe('Alice');
    expect(data.data.signatories[0].verified).toBe(false);
    expect(data.data.signatories[0].signed).toBe(false);
    expect(data.data.signatories[1].name).toBe('Bob');

    // Verify document status and hash in DB
    const updatedDoc = await db.document.findUnique({ where: { id: doc.id } });
    expect(updatedDoc!.status).toBe('PENDING_SIGNATURE');
    expect(updatedDoc!.documentHash).toBeTruthy();

    // Verify signatories created in DB
    const signatories = await db.signatory.findMany({ where: { documentId: doc.id } });
    expect(signatories).toHaveLength(2);
    expect(signatories.every((s) => s.otpHash !== null)).toBe(true);
    expect(signatories.every((s) => s.otpExpiresAt !== null)).toBe(true);
  });

  test('should return 403 when FEATURE_ESIG is disabled', async () => {
    // Temporarily override the feature flag mock
    const featureFlags = await import('@/lib/feature-flags');
    const originalValue = featureFlags.FEATURE_ESIG;
    Object.defineProperty(featureFlags, 'FEATURE_ESIG', { value: false, writable: true });

    setAuth(testUser);
    const doc = await seedDocument(testUser.id, testTemplate.id);

    const req = createRequest(doc.id, { signatories: validSignatories });
    const res = await POST(req, routeParams(doc.id));
    expect(res.status).toBe(403);

    const data = await res.json();
    expect(data.error.code).toBe('FEATURE_DISABLED');

    // Restore
    Object.defineProperty(featureFlags, 'FEATURE_ESIG', { value: originalValue, writable: true });
  });

  test('should return 400 for non-DRAFT document', async () => {
    setAuth(testUser);
    const doc = await seedDocument(testUser.id, testTemplate.id, {
      status: 'PENDING_SIGNATURE',
    });

    const req = createRequest(doc.id, { signatories: validSignatories });
    const res = await POST(req, routeParams(doc.id));
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error.code).toBe('INVALID_STATUS');
  });

  test('should return 403 for non-owner', async () => {
    setAuth(otherUser);
    const doc = await seedDocument(testUser.id, testTemplate.id);

    const req = createRequest(doc.id, { signatories: validSignatories });
    const res = await POST(req, routeParams(doc.id));
    expect(res.status).toBe(403);

    const data = await res.json();
    expect(data.error.code).toBe('FORBIDDEN');
  });

  test('should return 404 for non-existent document', async () => {
    setAuth(testUser);

    const req = createRequest('nonexistent-id', { signatories: validSignatories });
    const res = await POST(req, routeParams('nonexistent-id'));
    expect(res.status).toBe(404);

    const data = await res.json();
    expect(data.error.code).toBe('NOT_FOUND');
  });

  test('should return 400 for wet-ink-only category', async () => {
    setAuth(testUser);
    const doc = await seedDocument(testUser.id, wetInkTemplate.id);

    const req = createRequest(doc.id, { signatories: validSignatories });
    const res = await POST(req, routeParams(doc.id));
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error.code).toBe('WET_INK_REQUIRED');
  });

  test('should return 400 for empty signatories array', async () => {
    setAuth(testUser);
    const doc = await seedDocument(testUser.id, testTemplate.id);

    const req = createRequest(doc.id, { signatories: [] });
    const res = await POST(req, routeParams(doc.id));
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  test('should return 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any);
    const doc = await seedDocument(testUser.id, testTemplate.id);

    const req = createRequest(doc.id, { signatories: validSignatories });
    const res = await POST(req, routeParams(doc.id));
    expect(res.status).toBe(401);
  });
});
