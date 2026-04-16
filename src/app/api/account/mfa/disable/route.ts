import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/audit-trail';
import { compareSync } from 'bcryptjs';
import { z } from 'zod';

const DisableMfaSchema = z.object({
  password: z.string().min(1),
});

/**
 * POST /api/account/mfa/disable
 * PRIV-02: Disables MFA. Requires password confirmation for security.
 */
export async function POST(request: NextRequest) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  const userId = session!.user!.id!;

  try {
    const body = await request.json();
    const parsed = DisableMfaSchema.safeParse(body);

    if (!parsed.success) {
      return error('Password is required', 400, 'VALIDATION_ERROR');
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { hashedPassword: true, mfaEnabled: true, role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return error('Forbidden', 403, 'FORBIDDEN');
    }

    if (!user.mfaEnabled) {
      return error('MFA is not enabled.', 400, 'MFA_NOT_ENABLED');
    }

    if (!user.hashedPassword) {
      return error('Cannot verify password for OAuth-only accounts.', 400, 'NO_PASSWORD');
    }

    const passwordMatch = compareSync(parsed.data.password, user.hashedPassword);
    if (!passwordMatch) {
      return error('Incorrect password.', 401, 'INVALID_PASSWORD');
    }

    await db.user.update({
      where: { id: userId },
      data: {
        mfaSecret: null,
        mfaEnabled: false,
        mfaVerifiedAt: null,
      },
    });

    await logAudit('mfa.disabled', 'user', userId, userId);

    return success({ mfaEnabled: false });
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
