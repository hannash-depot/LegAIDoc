import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api/response';

type RouteParams = { params: Promise<{ token: string }> };

// GET /api/shared/[token] — View a shared document (no auth required)
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { token } = await params;

  const share = await db.documentShare.findUnique({
    where: { token },
    include: {
      document: {
        include: {
          template: {
            select: {
              nameHe: true,
              nameAr: true,
              nameEn: true,
              nameRu: true,
            },
          },
        },
      },
    },
  });

  if (!share) {
    return error('Share link not found', 404, 'SHARE_NOT_FOUND');
  }

  if (new Date() > share.expiresAt) {
    return error('Share link has expired', 410, 'SHARE_EXPIRED');
  }

  const doc = share.document;

  return success({
    id: doc.id,
    title: doc.title,
    status: doc.status,
    renderedBody: doc.renderedBody,
    locale: doc.locale,
    createdAt: doc.createdAt.toISOString(),
    template: doc.template,
    expiresAt: share.expiresAt.toISOString(),
  });
}
