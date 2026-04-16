import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api/response';
import { verifyTotpToken } from '@/lib/auth/totp';
import { logAudit } from '@/lib/audit/audit-trail';
import { z } from 'zod';

const MfaChallengeSchema = z.object({
  email: z.string().email(),
  token: z.string().length(6).regex(/^\d+$/),
});

/**
 * POST /api/auth/mfa/challenge
 * PRIV-02: Verifies TOTP token during login for admin accounts with MFA enabled.
 * Called by the login form after credentials are validated but before session is created.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = MfaChallengeSchema.safeParse(body);

    if (!parsed.success) {
      return error('Invalid input. Email and 6-digit token required.', 400, 'VALIDATION_ERROR');
    }

    const user = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, mfaSecret: true, mfaEnabled: true, email: true },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return error('MFA is not enabled for this account.', 400, 'MFA_NOT_ENABLED');
    }

    const isValid = verifyTotpToken(user.mfaSecret, parsed.data.token, user.email);

    if (!isValid) {
      await logAudit('mfa.challenge_failed', 'user', user.id, user.id);
      return error('Invalid verification code.', 401, 'INVALID_TOKEN');
    }

    await logAudit('mfa.challenge_passed', 'user', user.id, user.id);

    return success({ verified: true });
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
