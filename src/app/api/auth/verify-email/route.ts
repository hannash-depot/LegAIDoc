import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api/response';
import { consumeVerificationToken } from '@/lib/auth/tokens';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return error('Missing token or email', 400, 'VALIDATION_ERROR');
    }

    const isValid = await consumeVerificationToken(email, 'email-verify', token);
    if (!isValid) {
      return error('Invalid or expired verification token', 400, 'INVALID_TOKEN');
    }

    await db.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    logger.info('Email verified', { email });
    return success({ message: 'Email verified successfully.' });
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
