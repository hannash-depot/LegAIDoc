/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import { db } from '../../../../src/lib/db';
import { clearDbData, seedTestAdmin, seedTestUserWithPassword } from '../../../test-utils';
import { TOTP, Secret } from 'otpauth';
import { NextRequest } from 'next/server';

let adminUser: any;
let regularUser: any;

vi.mock('@/auth', () => ({
  auth: vi.fn(async () => ({
    user: { id: '', email: '', role: 'ADMIN' },
  })),
}));

vi.mock('@/lib/audit/audit-trail', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

const { auth } = await import('../../../../src/auth');
const { POST: setupMfa } = await import('../../../../src/app/api/account/mfa/setup/route');
const { POST: verifyMfa } = await import('../../../../src/app/api/account/mfa/verify/route');
const { POST: disableMfa } = await import('../../../../src/app/api/account/mfa/disable/route');

const ADMIN_PASSWORD = 'AdminPass123';

describe('MFA Setup API (/api/account/mfa)', () => {
  beforeAll(async () => {
    await clearDbData();
    adminUser = await seedTestAdmin(ADMIN_PASSWORD);
    regularUser = await seedTestUserWithPassword();
  });

  afterAll(async () => {
    await clearDbData();
  });

  describe('POST /api/account/mfa/setup', () => {
    test('should generate TOTP secret for admin', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);

      const res = await setupMfa();
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.secret).toBeDefined();
      expect(data.data.qrCodeDataUrl).toBeDefined();
      expect(data.data.qrCodeDataUrl).toContain('data:image/png');
    });

    test('should reject non-admin user', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: regularUser.id, email: regularUser.email, role: 'USER' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);

      const res = await setupMfa();
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/account/mfa/verify', () => {
    test('should enable MFA with valid TOTP code', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);

      // Get the stored secret
      const user = await db.user.findUnique({ where: { id: adminUser.id } });
      const secret = user!.mfaSecret!;

      // Generate valid TOTP code
      const totp = new TOTP({
        issuer: 'LegAIDoc',
        label: adminUser.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: Secret.fromBase32(secret),
      });
      const validCode = totp.generate();

      const req = new NextRequest('http://localhost:3000/api/account/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: validCode }),
      });
      const res = await verifyMfa(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.mfaEnabled).toBe(true);

      // Verify DB
      const updatedUser = await db.user.findUnique({ where: { id: adminUser.id } });
      expect(updatedUser!.mfaEnabled).toBe(true);
      expect(updatedUser!.mfaVerifiedAt).not.toBeNull();
    });

    test('should reject invalid TOTP code', async () => {
      // Reset MFA for this test
      await db.user.update({
        where: { id: adminUser.id },
        data: { mfaEnabled: false, mfaVerifiedAt: null },
      });

      const req = new NextRequest('http://localhost:3000/api/account/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: '000000' }),
      });
      const res = await verifyMfa(req);
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/account/mfa/disable', () => {
    test('should disable MFA with correct password', async () => {
      // Enable MFA first
      await db.user.update({
        where: { id: adminUser.id },
        data: { mfaEnabled: true, mfaVerifiedAt: new Date() },
      });

      vi.mocked(auth).mockResolvedValue({
        user: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/account/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ADMIN_PASSWORD }),
      });
      const res = await disableMfa(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.mfaEnabled).toBe(false);

      const user = await db.user.findUnique({ where: { id: adminUser.id } });
      expect(user!.mfaEnabled).toBe(false);
      expect(user!.mfaSecret).toBeNull();
    });

    test('should reject wrong password', async () => {
      // Re-enable MFA
      await db.user.update({
        where: { id: adminUser.id },
        data: {
          mfaEnabled: true,
          mfaSecret: 'TESTSECRET1234567890123456',
          mfaVerifiedAt: new Date(),
        },
      });

      const req = new NextRequest('http://localhost:3000/api/account/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'WrongPassword' }),
      });
      const res = await disableMfa(req);
      expect(res.status).toBe(401);
    });
  });
});
