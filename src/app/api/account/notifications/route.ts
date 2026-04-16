import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';
import { NotificationPrefsSchema } from '@/schemas/account';

/**
 * PUT /api/account/notifications
 * DASH-03 / NOTF-06: Update notification preferences.
 * Placeholder — stores preferences in DB for when NOTF module is built.
 */
export async function PUT(request: NextRequest) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = NotificationPrefsSchema.safeParse(body);

    if (!parsed.success) {
      return error(
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const userId = session!.user!.id!;

    await db.user.update({
      where: { id: userId },
      data: {
        notificationPrefs: parsed.data,
      },
    });

    return success({ updated: true });
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
