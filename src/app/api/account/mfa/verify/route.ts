import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';
import { verifyTotpToken } from '@/lib/auth/totp';
import { logAudit } from '@/lib/audit/audit-trail';
import { z } from 'zod';

const VerifyMfaSchema = z.object({
  token: z.string().length(6).regex(/^\d+$/),
});

/**
 * POST /api/account/mfa/verify
 * PRIV-02: Verifies a TOTP token and enables MFA for the account.
 * Used during initial setup to confirm the authenticator app is configured correctly.
 */
export async function POST(request: NextRequest) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  const userId = session!.user!.id!;

  try {
    const body = await request.json();
    const parsed = VerifyMfaSchema.safeParse(body);

    if (!parsed.success) {
      return error('Invalid token format. Must be 6 digits.', 400, 'VALIDATION_ERROR');
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true, mfaEnabled: true, email: true, role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return error('Forbidden', 403, 'FORBIDDEN');
    }

    if (!user.mfaSecret) {
      return error(
        'MFA has not been set up. Call /api/account/mfa/setup first.',
        400,
        'MFA_NOT_SETUP',
      );
    }

    if (user.mfaEnabled) {
      return error('MFA is already enabled.', 400, 'MFA_ALREADY_ENABLED');
    }

    // Verify the token
    const isValid = verifyTotpToken(user.mfaSecret, parsed.data.token, user.email);

    if (!isValid) {
      return error('Invalid verification code. Please try again.', 401, 'INVALID_TOKEN');
    }

    // Enable MFA
    await db.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaVerifiedAt: new Date(),
      },
    });

    await logAudit('mfa.enabled', 'user', userId, userId);

    return success({ mfaEnabled: true });
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
