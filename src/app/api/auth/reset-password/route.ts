import { NextRequest } from 'next/server';
import { hashSync } from 'bcryptjs';
import { ResetPasswordSchema } from '@/schemas/auth';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api/response';
import { consumeVerificationToken } from '@/lib/auth/tokens';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ResetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      return error(messages, 400, 'VALIDATION_ERROR');
    }

    const { token, email, password } = parsed.data;

    // Verify and consume the token
    const isValid = await consumeVerificationToken(email, 'pwd-reset', token);
    if (!isValid) {
      return error('Invalid or expired reset token', 400, 'INVALID_TOKEN');
    }

    // Update password
    const hashedPassword = hashSync(password, 12);
    await db.user.update({
      where: { email },
      data: { hashedPassword },
    });

    logger.info('Password reset successful', { email });
    return success({ message: 'Password has been reset successfully.' });
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
