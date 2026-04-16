import { NextRequest } from 'next/server';
import { hashSync } from 'bcryptjs';
import { RegisterSchema } from '@/schemas/auth';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api/response';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { FEATURE_EMAILS } from '@/lib/feature-flags';
import { createVerificationToken } from '@/lib/auth/tokens';
import { sendVerificationEmail } from '@/lib/email/send';
import { logger } from '@/lib/logger';

async function handler(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return error(
        fieldErrors.map((e) => `${e.field}: ${e.message}`).join('; '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const { name, email, password } = parsed.data;

    // Check for duplicate email
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return error('Email already registered', 409, 'EMAIL_EXISTS');
    }

    // Hash password with bcrypt (12 salt rounds per AUTH-04)
    const hashedPassword = hashSync(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        hashedPassword,
        // AUTH-05: defaults role=USER, preferredLocale='he' via schema
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        preferredLocale: true,
        createdAt: true,
      },
    });

    // Send verification email when emails are enabled
    if (FEATURE_EMAILS) {
      try {
        const token = await createVerificationToken(email, 'email-verify', 24 * 60 * 60 * 1000);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

        await sendVerificationEmail({
          to: email,
          verifyUrl,
          userName: name,
          locale: user.preferredLocale || 'he',
        });
      } catch (emailErr) {
        logger.error('Failed to send verification email during registration', emailErr, { email });
      }
    }

    return success(user, 201);
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

// 10 registrations per minute per IP
export const POST = withRateLimit(handler, { namespace: 'register', maxRequests: 10 });
