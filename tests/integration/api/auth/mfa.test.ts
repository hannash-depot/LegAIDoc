/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import { db } from '../../../../src/lib/db';
import { clearDbData, seedTestAdmin } from '../../../test-utils';
import { POST as mfaCheck } from '../../../../src/app/api/auth/mfa/check/route';
import { POST as mfaChallenge } from '../../../../src/app/api/auth/mfa/challenge/route';
import { generateTotpSecret } from '../../../../src/lib/auth/totp';
import { TOTP, Secret } from 'otpauth';
import { NextRequest } from 'next/server';

// Mock audit trail to avoid side effects
vi.mock('@/lib/audit/audit-trail', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

describe('MFA API', () => {
  let adminUser: any;
  let totpSecret: string;

  beforeAll(async () => {
    await clearDbData();
    adminUser = await seedTestAdmin();

    // Enable MFA on the admin user
    totpSecret = generateTotpSecret();
    await db.user.update({
      where: { id: adminUser.id },
      data: {
        mfaEnabled: true,
        mfaSecret: totpSecret,
        mfaVerifiedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await clearDbData();
  });

  describe('POST /api/auth/mfa/check', () => {
    const createRequest = (body: any) => {
      return new NextRequest('http://localhost:3000/api/auth/mfa/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    };

    test('should return mfaRequired: true for MFA-enabled user', async () => {
      const req = createRequest({ email: adminUser.email });
      const res = await mfaCheck(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.mfaRequired).toBe(true);
    });

    test('should return mfaRequired: false for non-MFA user', async () => {
      const req = createRequest({ email: 'nobody@example.com' });
      const res = await mfaCheck(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.mfaRequired).toBe(false);
    });

    test('should reject invalid email', async () => {
      const req = createRequest({ email: 'bad' });
      const res = await mfaCheck(req);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/mfa/challenge', () => {
    const createRequest = (body: any) => {
      return new NextRequest('http://localhost:3000/api/auth/mfa/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    };

    test('should verify valid TOTP token', async () => {
      // Generate a valid TOTP token
      const totp = new TOTP({
        issuer: 'LegAIDoc',
        label: adminUser.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: Secret.fromBase32(totpSecret),
      });
      const validCode = totp.generate();

      const req = createRequest({ email: adminUser.email, token: validCode });
      const res = await mfaChallenge(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.data.verified).toBe(true);
    });

    test('should reject invalid TOTP token', async () => {
      const req = createRequest({ email: adminUser.email, token: '000000' });
      const res = await mfaChallenge(req);
      expect(res.status).toBe(401);

      const data = await res.json();
      expect(data.error.code).toBe('INVALID_TOKEN');
    });

    test('should reject user without MFA enabled', async () => {
      // Create a user without MFA
      const noMfaUser = await db.user.create({
        data: {
          email: 'nomfa@example.com',
          name: 'No MFA',
          role: 'USER',
        },
      });

      const req = createRequest({ email: noMfaUser.email, token: '123456' });
      const res = await mfaChallenge(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error.code).toBe('MFA_NOT_ENABLED');
    });

    test('should reject malformed input', async () => {
      const req = createRequest({ email: adminUser.email, token: 'abc' });
      const res = await mfaChallenge(req);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
