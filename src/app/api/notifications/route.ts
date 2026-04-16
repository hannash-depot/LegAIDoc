import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';
import { parsePagination, paginationMeta } from '@/lib/api/pagination';
import { NotificationFilterSchema } from '@/schemas/notification';
import { Prisma } from '@prisma/client';

// GET /api/notifications — List user's notifications (paginated)
export async function GET(request: NextRequest) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  const searchParams = request.nextUrl.searchParams;
  const pagination = parsePagination(searchParams);

  const filterParsed = NotificationFilterSchema.safeParse({
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    read: searchParams.get('read') ?? undefined,
  });

  const readFilter = filterParsed.success ? filterParsed.data.read : undefined;

  const where: Prisma.NotificationWhereInput = {
    userId: session!.user!.id!,
    ...(readFilter !== undefined ? { read: readFilter } : {}),
  };

  try {
    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      db.notification.count({ where }),
    ]);

    return success({
      notifications,
      pagination: paginationMeta(total, pagination),
    });
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
