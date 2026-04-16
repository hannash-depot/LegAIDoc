import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api/response';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { createVerificationToken } from '@/lib/auth/tokens';
import { sendVerificationEmail } from '@/lib/email/send';
import { FEATURE_EMAILS } from '@/lib/feature-flags';
import { logger } from '@/lib/logger';
import { z } from 'zod/v4';

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

const ResendSchema = z.object({
  email: z.email(),
});

async function handler(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ResendSchema.safeParse(body);

    if (!parsed.success) {
      return error('Invalid email', 400, 'VALIDATION_ERROR');
    }

    const { email } = parsed.data;
    const user = await db.user.findUnique({ where: { email } });

    if (user && !user.emailVerified && FEATURE_EMAILS) {
      const token = await createVerificationToken(email, 'email-verify', TOKEN_EXPIRY_MS);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

      const result = await sendVerificationEmail({
        to: email,
        verifyUrl,
        userName: user.name || email,
        locale: user.preferredLocale || 'he',
      });

      if (!result.success) {
        logger.error('Failed to send verification email', undefined, { email });
      }
    }

    // Always return success to prevent enumeration
    return success({ message: 'If eligible, a verification email has been sent.' });
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

// 3 requests per 15 minutes per IP
export const POST = withRateLimit(handler, {
  namespace: 'resend-verification',
  maxRequests: 3,
  windowMs: 15 * 60 * 1000,
});
