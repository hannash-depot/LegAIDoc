import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api/require-admin';
import { success } from '@/lib/api/response';
import type { Prisma } from '@prisma/client';

/**
 * GET /api/admin/payments — Paginated payment listing with optional status filter.
 * Query params: ?status=COMPLETED&cursor=<lastPaymentId>&limit=50
 */
export async function GET(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const cursor = searchParams.get('cursor');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

  const where: Prisma.PaymentWhereInput = {};
  if (status) {
    where.status = status as Prisma.EnumPaymentStatusFilter;
  }

  const payments = await db.payment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1, // fetch one extra to detect hasMore
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: { select: { id: true, name: true, email: true } },
      subscription: {
        select: { id: true, plan: { select: { nameEn: true } } },
      },
    },
  });

  const hasMore = payments.length > limit;
  const items = hasMore ? payments.slice(0, limit) : payments;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const totalCount = await db.payment.count({ where });

  return success({ items, nextCursor, hasMore, totalCount });
}
