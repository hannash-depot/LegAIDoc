import { NextRequest } from 'next/server';
import { ForgotPasswordSchema } from '@/schemas/auth';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api/response';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { createVerificationToken } from '@/lib/auth/tokens';
import { sendPasswordResetEmail } from '@/lib/email/send';
import { FEATURE_EMAILS } from '@/lib/feature-flags';
import { logger } from '@/lib/logger';

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

async function handler(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ForgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return error('Invalid email', 400, 'VALIDATION_ERROR');
    }

    const { email } = parsed.data;

    // Always return success to prevent email enumeration
    const user = await db.user.findUnique({ where: { email } });

    if (user && user.hashedPassword && FEATURE_EMAILS) {
      const token = await createVerificationToken(email, 'pwd-reset', TOKEN_EXPIRY_MS);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const resetUrl = `${appUrl}/he/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

      const result = await sendPasswordResetEmail({
        to: email,
        resetUrl,
        userName: user.name || email,
        locale: user.preferredLocale || 'he',
      });

      if (!result.success) {
        logger.error('Failed to send password reset email', undefined, { email });
      }
    }

    // Always return success
    return success({ message: 'If an account exists, a reset link has been sent.' });
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

// 3 requests per 15 minutes per IP
export const POST = withRateLimit(handler, {
  namespace: 'forgot-password',
  maxRequests: 3,
  windowMs: 15 * 60 * 1000,
});
