import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/audit-trail';
import { PasswordChangeSchema } from '@/schemas/account';
import { compare, hash } from 'bcryptjs';

/**
 * PUT /api/account/password
 * DASH-03: Change user password with current password verification.
 */
export async function PUT(request: NextRequest) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = PasswordChangeSchema.safeParse(body);

    if (!parsed.success) {
      return error(
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const userId = session!.user!.id!;

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || !user.hashedPassword) {
      return error('Cannot verify identity — account uses external login', 400, 'NO_PASSWORD');
    }

    const validPassword = await compare(parsed.data.currentPassword, user.hashedPassword);
    if (!validPassword) {
      return error('Current password is incorrect', 401, 'INVALID_PASSWORD');
    }

    const hashedPassword = await hash(parsed.data.newPassword, 12);

    await db.user.update({
      where: { id: userId },
      data: { hashedPassword },
    });

    await logAudit('account.password_changed', 'user', userId, userId);

    return success({ updated: true });
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
