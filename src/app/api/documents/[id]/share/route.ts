import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/audit-trail';
import { logger } from '@/lib/logger';
import { ShareCreateSchema } from '@/schemas/share';

type RouteParams = { params: Promise<{ id: string }> };

const SHARE_DURATION_HOURS = 72;

// POST /api/documents/[id]/share — Generate a time-limited share URL (DOCM-06)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  const rawBody = await request.json().catch(() => ({}));
  const parsed = ShareCreateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return error(
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      400,
      'VALIDATION_ERROR',
    );
  }
  const { permission } = parsed.data;

  const { id } = await params;

  try {
    const document = await db.document.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });

    if (!document) {
      return error('Document not found', 404, 'NOT_FOUND');
    }

    if (document.userId !== session!.user!.id) {
      return error('Forbidden', 403, 'FORBIDDEN');
    }

    // Only non-archived documents can be shared
    if (document.status === 'ARCHIVED') {
      return error('Archived documents cannot be shared', 400, 'DOCUMENT_ARCHIVED');
    }

    const expiresAt = new Date(Date.now() + SHARE_DURATION_HOURS * 60 * 60 * 1000);

    const share = await db.documentShare.create({
      data: {
        documentId: id,
        createdBy: session!.user!.id!,
        expiresAt,
        permission,
      },
    });

    await logAudit('document.shared', 'document', id, session!.user!.id!, {
      shareId: share.id,
      expiresAt: expiresAt.toISOString(),
    });

    return success(
      {
        token: share.token,
        expiresAt: share.expiresAt.toISOString(),
      },
      201,
    );
  } catch (err) {
    logger.error('Share link creation error', err);
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

// GET /api/documents/[id]/share — List active share links for a document
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const document = await db.document.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!document) {
    return error('Document not found', 404, 'NOT_FOUND');
  }

  if (document.userId !== session!.user!.id) {
    return error('Forbidden', 403, 'FORBIDDEN');
  }

  const shares = await db.documentShare.findMany({
    where: {
      documentId: id,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      token: true,
      expiresAt: true,
      createdAt: true,
      permission: true,
    },
  });

  return success(shares);
}
