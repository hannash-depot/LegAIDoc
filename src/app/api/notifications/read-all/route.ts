import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';

// PATCH /api/notifications/read-all — Mark all notifications as read
export async function PATCH() {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  try {
    const result = await db.notification.updateMany({
      where: { userId: session!.user!.id!, read: false },
      data: { read: true },
    });

    return success({ updated: result.count });
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
