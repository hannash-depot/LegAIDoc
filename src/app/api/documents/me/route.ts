import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success } from '@/lib/api/response';
import { parsePagination, paginationMeta } from '@/lib/api/pagination';

// GET /api/documents/me
export async function GET(request: NextRequest) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  const { searchParams } = request.nextUrl;
  const pagination = parsePagination(searchParams);

  const where = {
    userId: session!.user!.id,
  };

  const [documents, total] = await Promise.all([
    db.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        pdfUrl: true,
        locale: true,
        template: {
          select: {
            nameEn: true,
            nameHe: true,
            nameAr: true,
            nameRu: true,
          },
        },
      },
    }),
    db.document.count({ where }),
  ]);

  return success({
    items: documents,
    ...paginationMeta(total, pagination),
  });
}
