/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import { createHash } from 'crypto';
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
let testTemplate: any;

// Helper: hash an OTP the same way signature-service does
function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex');
}

vi.mock('@/auth', () => ({
  auth: vi.fn(async () => null),
}));

vi.mock('@/lib/audit/audit-trail', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/feature-flags', () => ({
  FEATURE_ESIG: true,
  FEATURE_EMAILS: false,
  FEATURE_PAYMENTS: false,
  FEATURE_AI_IMPORT: false,
}));

vi.mock('@/lib/email/send', () => ({
  sendSignatureRequestEmail: vi.fn().mockResolvedValue(undefined),
  sendOtpEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/pdf/audit-trail-page', () => ({
  generateAuditTrailHtml: vi.fn().mockReturnValue('<div>Audit Trail</div>'),
}));

vi.mock('@/lib/storage/blob', () => ({
  uploadBlob: vi.fn().mockResolvedValue('https://storage.example.com/sig.png'),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(
    async () =>
      new Map([
        ['x-forwarded-for', '127.0.0.1'],
        ['user-agent', 'test-agent'],
      ]),
  ),
}));

const { auth } = await import('../../../../src/auth');

// Import route handlers after mocks
const { POST: verifyOtpRoute } =
  await import('../../../../src/app/api/documents/[id]/sign/verify-otp/route');
const { POST: completeRoute } =
  await import('../../../../src/app/api/documents/[id]/sign/complete/route');
const { POST: signatoryOtpRoute } =
  await import('../../../../src/app/api/documents/[id]/signatories/[sigId]/otp/route');
const { POST: signatoryVerifyRoute } =
  await import('../../../../src/app/api/documents/[id]/signatories/[sigId]/verify/route');
const { POST: signatorySignRoute } =
  await import('../../../../src/app/api/documents/[id]/signatories/[sigId]/sign/route');

/**
 * Creates a PENDING_SIGNATURE document with signatories seeded directly in the DB.
 */
async function seedPendingDocument(
  userId: string,
  templateId: string,
  signatories: Array<{
    name: string;
    email: string;
    role: any;
    otp?: string;
  }>,
) {
  const doc = await seedDocument(userId, templateId, {
    status: 'PENDING_SIGNATURE',
    documentHash: createHash('sha256').update('<p>Contract for John Doe</p>').digest('hex'),
  });

  const sigRecords = [];
  for (const sig of signatories) {
    const otp = sig.otp || '123456';
    const record = await db.signatory.create({
      data: {
        documentId: doc.id,
        name: sig.name,
        email: sig.email,
        role: sig.role,
        otpHash: hashOtp(otp),
        otpExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    sigRecords.push({ ...record, otp });
  }

  return { doc, signatories: sigRecords };
}

describe('Sign Verify & Complete APIs', () => {
  beforeAll(async () => {
    await clearDbData();
    testUser = await seedTestUserWithPassword();
    const category = await seedCategory({ requiresWetInk: false });
    testTemplate = await seedTemplate(category.id);

    vi.mocked(auth).mockResolvedValue({
      user: { id: testUser.id, email: testUser.email, role: 'USER' },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
  });

  afterAll(async () => {
    await clearDbData();
  });

  // ─── POST /api/documents/[id]/sign/verify-otp ───

  describe('POST /api/documents/[id]/sign/verify-otp', () => {
    const routeParams = (id: string) => ({ params: Promise.resolve({ id }) });

    test('should verify a valid OTP', async () => {
      const { doc, signatories } = await seedPendingDocument(testUser.id, testTemplate.id, [
        { name: 'Alice', email: 'alice@example.com', role: 'INITIATOR', otp: '654321' },
      ]);
      const sig = signatories[0];

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}/sign/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatoryId: sig.id, otp: '654321' }),
      });
      const res = await verifyOtpRoute(req, routeParams(doc.id));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.verified).toBe(true);
      expect(data.data.signatoryId).toBe(sig.id);

      // Verify DB updated
      const updated = await db.signatory.findUnique({ where: { id: sig.id } });
      expect(updated!.verifiedAt).toBeTruthy();
    });

    test('should return 400 for invalid OTP', async () => {
      const { doc, signatories } = await seedPendingDocument(testUser.id, testTemplate.id, [
        { name: 'Bob', email: 'bob@example.com', role: 'COUNTER_PARTY', otp: '111111' },
      ]);
      const sig = signatories[0];

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}/sign/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatoryId: sig.id, otp: '999999' }),
      });
      const res = await verifyOtpRoute(req, routeParams(doc.id));
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error.code).toBe('INVALID_OTP');
    });

    test('should return 400 for already verified signatory', async () => {
      const { doc, signatories } = await seedPendingDocument(testUser.id, testTemplate.id, [
        { name: 'Carol', email: 'carol@example.com', role: 'INITIATOR', otp: '222222' },
      ]);
      const sig = signatories[0];

      // Mark as already verified
      await db.signatory.update({
        where: { id: sig.id },
        data: { verifiedAt: new Date() },
      });

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}/sign/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatoryId: sig.id, otp: '222222' }),
      });
      const res = await verifyOtpRoute(req, routeParams(doc.id));
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error.code).toBe('ALREADY_VERIFIED');
    });

    test('should return 410 for expired OTP', async () => {
      const doc = await seedDocument(testUser.id, testTemplate.id, {
        status: 'PENDING_SIGNATURE',
        documentHash: createHash('sha256').update('<p>Contract for John Doe</p>').digest('hex'),
      });
      const sig = await db.signatory.create({
        data: {
          documentId: doc.id,
          name: 'Expired',
          email: 'expired@example.com',
          role: 'COUNTER_PARTY',
          otpHash: hashOtp('333333'),
          otpExpiresAt: new Date(Date.now() - 1000), // Already expired
        },
      });

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}/sign/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatoryId: sig.id, otp: '333333' }),
      });
      const res = await verifyOtpRoute(req, routeParams(doc.id));
      expect(res.status).toBe(410);

      const data = await res.json();
      expect(data.error.code).toBe('OTP_EXPIRED');
    });

    test('should return 404 for signatory on wrong document', async () => {
      const { signatories } = await seedPendingDocument(testUser.id, testTemplate.id, [
        { name: 'Wrong', email: 'wrong@example.com', role: 'INITIATOR' },
      ]);

      const req = new NextRequest('http://localhost:3000/api/documents/wrong-doc/sign/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatoryId: signatories[0].id, otp: '123456' }),
      });
      const res = await verifyOtpRoute(req, routeParams('wrong-doc'));
      expect(res.status).toBe(404);
    });
  });

  // ─── POST /api/documents/[id]/sign/complete ───

  describe('POST /api/documents/[id]/sign/complete', () => {
    const routeParams = (id: string) => ({ params: Promise.resolve({ id }) });

    test('should complete signing for a verified signatory', async () => {
      const { doc, signatories } = await seedPendingDocument(testUser.id, testTemplate.id, [
        { name: 'Signer', email: 'signer@example.com', role: 'INITIATOR' },
      ]);
      const sig = signatories[0];

      // Mark as verified
      await db.signatory.update({
        where: { id: sig.id },
        data: { verifiedAt: new Date() },
      });

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}/sign/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatoryId: sig.id }),
      });
      const res = await completeRoute(req, routeParams(doc.id));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.signed).toBe(true);
      expect(data.data.signatoryId).toBe(sig.id);
      // Single signatory: should transition to SIGNED
      expect(data.data.documentStatus).toBe('SIGNED');

      // Verify in DB
      const updatedSig = await db.signatory.findUnique({ where: { id: sig.id } });
      expect(updatedSig!.signedAt).toBeTruthy();

      const updatedDoc = await db.document.findUnique({ where: { id: doc.id } });
      expect(updatedDoc!.status).toBe('SIGNED');

      // Verify signature record created
      const sigRecord = await db.signatureRecord.findFirst({ where: { documentId: doc.id } });
      expect(sigRecord).toBeTruthy();
      expect(sigRecord!.hashAlgorithm).toBe('SHA-256');
    });

    test('should keep PENDING_SIGNATURE when not all signatories have signed', async () => {
      const { doc, signatories } = await seedPendingDocument(testUser.id, testTemplate.id, [
        { name: 'First', email: 'first@example.com', role: 'INITIATOR' },
        { name: 'Second', email: 'second@example.com', role: 'COUNTER_PARTY' },
      ]);

      // Only verify the first signatory
      await db.signatory.update({
        where: { id: signatories[0].id },
        data: { verifiedAt: new Date() },
      });

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}/sign/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatoryId: signatories[0].id }),
      });
      const res = await completeRoute(req, routeParams(doc.id));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.signed).toBe(true);
      expect(data.data.documentStatus).toBe('PENDING_SIGNATURE');
    });

    test('should return 400 for unverified signatory', async () => {
      const { doc, signatories } = await seedPendingDocument(testUser.id, testTemplate.id, [
        { name: 'Unverified', email: 'unverified@example.com', role: 'INITIATOR' },
      ]);

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}/sign/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatoryId: signatories[0].id }),
      });
      const res = await completeRoute(req, routeParams(doc.id));
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error.code).toBe('NOT_VERIFIED');
    });

    test('should return 400 for already signed signatory', async () => {
      const { doc, signatories } = await seedPendingDocument(testUser.id, testTemplate.id, [
        { name: 'Double', email: 'double@example.com', role: 'INITIATOR' },
      ]);

      await db.signatory.update({
        where: { id: signatories[0].id },
        data: { verifiedAt: new Date(), signedAt: new Date() },
      });

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}/sign/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatoryId: signatories[0].id }),
      });
      const res = await completeRoute(req, routeParams(doc.id));
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error.code).toBe('ALREADY_SIGNED');
    });

    test('should return 404 for non-existent signatory', async () => {
      const doc = await seedDocument(testUser.id, testTemplate.id, {
        status: 'PENDING_SIGNATURE',
      });

      const req = new NextRequest(`http://localhost:3000/api/documents/${doc.id}/sign/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatoryId: 'nonexistent-id' }),
      });
      const res = await completeRoute(req, routeParams(doc.id));
      expect(res.status).toBe(404);
    });
  });

  // ─── POST /api/documents/[id]/signatories/[sigId]/otp ───

  describe('POST /api/documents/[id]/signatories/[sigId]/otp', () => {
    const routeParams = (id: string, sigId: string) => ({
      params: Promise.resolve({ id, sigId }),
    });

    test('should generate and store a new OTP for a signatory', async () => {
      const { doc, signatories } = await seedPendingDocument(testUser.id, testTemplate.id, [
        { name: 'OtpUser', email: 'otpuser@example.com', role: 'INITIATOR' },
      ]);
      const sig = signatories[0];

      const req = new NextRequest(
        `http://localhost:3000/api/documents/${doc.id}/signatories/${sig.id}/otp`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
      );
      const res = await signatoryOtpRoute(req, routeParams(doc.id, sig.id));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);

      // OTP hash should be refreshed in DB
      const updated = await db.signatory.findUnique({ where: { id: sig.id } });
      expect(updated!.otpHash).toBeTruthy();
      expect(updated!.otpExpiresAt).toBeTruthy();
      // The new OTP hash should differ from the original (different random OTP)
      // This is probabilistic but extremely unlikely to collide
    });

    test('should return 404 for non-existent signatory', async () => {
      const doc = await seedDocument(testUser.id, testTemplate.id, {
        status: 'PENDING_SIGNATURE',
      });

      const req = new NextRequest(
        `http://localhost:3000/api/documents/${doc.id}/signatories/nonexistent/otp`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
      );
      const res = await signatoryOtpRoute(req, routeParams(doc.id, 'nonexistent'));
      expect(res.status).toBe(404);
    });

    test('should return 404 when document is not PENDING_SIGNATURE', async () => {
      const doc = await seedDocument(testUser.id, testTemplate.id, { status: 'DRAFT' });
      const sig = await db.signatory.create({
        data: {
          documentId: doc.id,
          name: 'Draft Sig',
          email: 'draftsig@example.com',
          role: 'INITIATOR',
          otpHash: hashOtp('000000'),
          otpExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      const req = new NextRequest(
        `http://localhost:3000/api/documents/${doc.id}/signatories/${sig.id}/otp`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
      );
      const res = await signatoryOtpRoute(req, routeParams(doc.id, sig.id));
      expect(res.status).toBe(404);
    });
  });

  // ─── POST /api/documents/[id]/signatories/[sigId]/verify ───

  describe('POST /api/documents/[id]/signatories/[sigId]/verify', () => {
    const routeParams = (id: string, sigId: string) => ({
      params: Promise.resolve({ id, sigId }),
    });

    test('should verify signatory with valid OTP', async () => {
      const { doc, signatories } = await seedPendingDocument(testUser.id, testTemplate.id, [
        { name: 'Verifier', email: 'verifier@example.com', role: 'INITIATOR', otp: '444444' },
      ]);
      const sig = signatories[0];

      const req = new NextRequest(
        `http://localhost:3000/api/documents/${doc.id}/signatories/${sig.id}/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp: '444444' }),
        },
      );
      const res = await signatoryVerifyRoute(req, routeParams(doc.id, sig.id));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify DB: verifiedAt set, otpHash cleared
      const updated = await db.signatory.findUnique({ where: { id: sig.id } });
      expect(updated!.verifiedAt).toBeTruthy();
      expect(updated!.otpHash).toBeNull();
      expect(updated!.otpExpiresAt).toBeNull();
    });

    test('should return 400 for invalid OTP', async () => {
      const { doc, signatories } = await seedPendingDocument(testUser.id, testTemplate.id, [
        { name: 'Bad OTP', email: 'badotp@example.com', role: 'COUNTER_PARTY', otp: '555555' },
      ]);
      const sig = signatories[0];

      const req = new NextRequest(
        `http://localhost:3000/api/documents/${doc.id}/signatories/${sig.id}/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp: '000000' }),
        },
      );
      const res = await signatoryVerifyRoute(req, routeParams(doc.id, sig.id));
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error.code).toBe('INVALID_OTP');
    });

    test('should return 400 for expired OTP', async () => {
      const doc = await seedDocument(testUser.id, testTemplate.id, {
        status: 'PENDING_SIGNATURE',
        documentHash: createHash('sha256').update('<p>Contract for John Doe</p>').digest('hex'),
      });
      const sig = await db.signatory.create({
        data: {
          documentId: doc.id,
          name: 'Expired Verify',
          email: 'expver@example.com',
          role: 'COUNTER_PARTY',
          otpHash: hashOtp('666666'),
          otpExpiresAt: new Date(Date.now() - 1000),
        },
      });

      const req = new NextRequest(
        `http://localhost:3000/api/documents/${doc.id}/signatories/${sig.id}/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp: '666666' }),
        },
      );
      const res = await signatoryVerifyRoute(req, routeParams(doc.id, sig.id));
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error.code).toBe('OTP_EXPIRED');
    });

    test('should return 404 for wrong document-signatory combination', async () => {
      const { signatories } = await seedPendingDocument(testUser.id, testTemplate.id, [
        { name: 'Mismatch', email: 'mismatch@example.com', role: 'INITIATOR' },
      ]);

      const req = new NextRequest(
        `http://localhost:3000/api/documents/wrong-doc/signatories/${signatories[0].id}/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp: '123456' }),
        },
      );
      const res = await signatoryVerifyRoute(req, routeParams('wrong-doc', signatories[0].id));
      expect(res.status).toBe(404);
    });
  });

  // ─── POST /api/documents/[id]/signatories/[sigId]/sign ───

  describe('POST /api/documents/[id]/signatories/[sigId]/sign', () => {
    const routeParams = (id: string, sigId: string) => ({
      params: Promise.resolve({ id, sigId }),
    });

    test('should sign document for a verified signatory', async () => {
      const { doc, signatories } = await seedPendingDocument(testUser.id, testTemplate.id, [
        { name: 'SignerA', email: 'signera@example.com', role: 'INITIATOR' },
      ]);
      const sig = signatories[0];

      // Mark verified recently
      await db.signatory.update({
        where: { id: sig.id },
        data: { verifiedAt: new Date() },
      });

      const req = new NextRequest(
        `http://localhost:3000/api/documents/${doc.id}/signatories/${sig.id}/sign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ termsAccepted: true }),
        },
      );
      const res = await signatorySignRoute(req, routeParams(doc.id, sig.id));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.completelySigned).toBe(true);

      // Verify DB
      const updatedSig = await db.signatory.findUnique({ where: { id: sig.id } });
      expect(updatedSig!.signedAt).toBeTruthy();

      const updatedDoc = await db.document.findUnique({ where: { id: doc.id } });
      expect(updatedDoc!.status).toBe('SIGNED');
    });

    test('should return 401 for unverified signatory', async () => {
      const { doc, signatories } = await seedPendingDocument(testUser.id, testTemplate.id, [
        { name: 'Unverified Sign', email: 'unsign@example.com', role: 'COUNTER_PARTY' },
      ]);

      const req = new NextRequest(
        `http://localhost:3000/api/documents/${doc.id}/signatories/${signatories[0].id}/sign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ termsAccepted: true }),
        },
      );
      const res = await signatorySignRoute(req, routeParams(doc.id, signatories[0].id));
      expect(res.status).toBe(401);

      const data = await res.json();
      expect(data.error.code).toBe('NOT_VERIFIED');
    });

    test('should return 400 for already signed signatory', async () => {
      const { doc, signatories } = await seedPendingDocument(testUser.id, testTemplate.id, [
        { name: 'Already Signed', email: 'already@example.com', role: 'INITIATOR' },
      ]);

      await db.signatory.update({
        where: { id: signatories[0].id },
        data: { verifiedAt: new Date(), signedAt: new Date() },
      });

      const req = new NextRequest(
        `http://localhost:3000/api/documents/${doc.id}/signatories/${signatories[0].id}/sign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ termsAccepted: true }),
        },
      );
      const res = await signatorySignRoute(req, routeParams(doc.id, signatories[0].id));
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error.code).toBe('ALREADY_SIGNED');
    });

    test('should return 400 when termsAccepted is false', async () => {
      const { doc, signatories } = await seedPendingDocument(testUser.id, testTemplate.id, [
        { name: 'No Terms', email: 'noterms@example.com', role: 'INITIATOR' },
      ]);

      await db.signatory.update({
        where: { id: signatories[0].id },
        data: { verifiedAt: new Date() },
      });

      const req = new NextRequest(
        `http://localhost:3000/api/documents/${doc.id}/signatories/${signatories[0].id}/sign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ termsAccepted: false }),
        },
      );
      const res = await signatorySignRoute(req, routeParams(doc.id, signatories[0].id));
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    test('should return 404 for non-existent document', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/documents/fake-doc/signatories/fake-sig/sign',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ termsAccepted: true }),
        },
      );
      const res = await signatorySignRoute(req, routeParams('fake-doc', 'fake-sig'));
      expect(res.status).toBe(404);
    });

    test('should return 400 when document is not PENDING_SIGNATURE', async () => {
      const doc = await seedDocument(testUser.id, testTemplate.id, { status: 'DRAFT' });
      const sig = await db.signatory.create({
        data: {
          documentId: doc.id,
          name: 'Draft Signer',
          email: 'draft-signer@example.com',
          role: 'INITIATOR',
          otpHash: hashOtp('000000'),
          otpExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
          verifiedAt: new Date(),
        },
      });

      const req = new NextRequest(
        `http://localhost:3000/api/documents/${doc.id}/signatories/${sig.id}/sign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ termsAccepted: true }),
        },
      );
      const res = await signatorySignRoute(req, routeParams(doc.id, sig.id));
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error.code).toBe('INVALID_STATUS');
    });
  });
});
