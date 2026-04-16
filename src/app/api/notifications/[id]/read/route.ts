import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/notifications/[id]/read — Mark single notification as read
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  try {
    const notification = await db.notification.findUnique({ where: { id } });

    if (!notification || notification.userId !== session!.user!.id!) {
      return error('Notification not found', 404, 'NOT_FOUND');
    }

    if (notification.read) {
      return success({ updated: true });
    }

    await db.notification.update({
      where: { id },
      data: { read: true },
    });

    return success({ updated: true });
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
