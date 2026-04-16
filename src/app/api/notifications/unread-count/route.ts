import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';

// GET /api/notifications/unread-count — Lightweight unread badge count
export async function GET() {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  try {
    const count = await db.notification.count({
      where: { userId: session!.user!.id!, read: false },
    });

    return success({ count });
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
