import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';
import { generateTotpSecret, generateQrCodeDataUrl } from '@/lib/auth/totp';
import { logAudit } from '@/lib/audit/audit-trail';

/**
 * POST /api/account/mfa/setup
 * PRIV-02: Generates a new TOTP secret and returns QR code for scanning.
 * Only available to ADMIN users. Secret is stored but MFA is not yet enabled
 * until verified via /api/account/mfa/verify.
 */
export async function POST() {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  const userId = session!.user!.id!;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true, mfaEnabled: true },
  });

  if (!user) {
    return error('User not found', 404, 'NOT_FOUND');
  }

  if (user.role !== 'ADMIN') {
    return error('MFA setup is only available for admin accounts', 403, 'FORBIDDEN');
  }

  if (user.mfaEnabled) {
    return error(
      'MFA is already enabled. Disable it first to reconfigure.',
      400,
      'MFA_ALREADY_ENABLED',
    );
  }

  // Generate new secret
  const secret = generateTotpSecret();

  // Store secret (not yet enabled)
  await db.user.update({
    where: { id: userId },
    data: { mfaSecret: secret, mfaEnabled: false },
  });

  // Generate QR code
  const qrCodeDataUrl = await generateQrCodeDataUrl(secret, user.email);

  await logAudit('mfa.setup_initiated', 'user', userId, userId);

  return success({
    secret,
    qrCodeDataUrl,
  });
}
