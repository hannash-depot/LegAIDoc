import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api/require-admin';
import { success } from '@/lib/api/response';
import { parsePagination, paginationMeta } from '@/lib/api/pagination';

// USR-01: GET list users (admin)
export async function GET(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = request.nextUrl;
  const pagination = parsePagination(searchParams);

  // Optional filtering
  const role = searchParams.get('role');
  const search = searchParams.get('search');

  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { documents: true, subscriptions: true } },
      },
    }),
    db.user.count({ where }),
  ]);

  return success({
    items: users,
    ...paginationMeta(total, pagination),
  });
}
