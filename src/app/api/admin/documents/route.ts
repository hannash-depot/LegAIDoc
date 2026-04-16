import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api/require-admin';
import { success } from '@/lib/api/response';
import { parsePagination, paginationMeta } from '@/lib/api/pagination';

// DOC-01: GET all documents (admin)
export async function GET(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = request.nextUrl;
  const pagination = parsePagination(searchParams);

  const status = searchParams.get('status');
  const search = searchParams.get('search'); // search by title or user email
  const categoryId = searchParams.get('categoryId');
  const templateActive = searchParams.get('templateActive'); // 'true' | 'false'

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  // Filter by template's category or active state
  const templateWhere: Record<string, unknown> = {};
  if (categoryId) templateWhere.categoryId = categoryId;
  if (templateActive === 'true') templateWhere.isActive = true;
  if (templateActive === 'false') templateWhere.isActive = false;
  if (Object.keys(templateWhere).length > 0) {
    where.template = templateWhere;
  }

  const [documents, total] = await Promise.all([
    db.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
      include: {
        user: { select: { id: true, name: true, email: true } },
        template: {
          select: {
            id: true,
            slug: true,
            nameEn: true,
            isActive: true,
            category: { select: { id: true, nameEn: true, nameHe: true } },
          },
        },
        _count: { select: { signatories: true } },
      },
    }),
    db.document.count({ where }),
  ]);

  return success({
    items: documents,
    ...paginationMeta(total, pagination),
  });
}
