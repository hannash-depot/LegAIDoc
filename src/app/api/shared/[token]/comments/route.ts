import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api/response';
import { logger } from '@/lib/logger';
import { notifyDocumentComment } from '@/lib/notifications';
import { z } from 'zod/v4';

type RouteParams = { params: Promise<{ token: string }> };

const CreateCommentSchema = z.object({
  authorName: z.string().min(1),
  content: z.string().min(1),
  quote: z.string().optional(),
  position: z.string().optional(),
});

// GET /api/shared/[token]/comments — Fetch comments for a shared document
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { token } = await params;

  const share = await db.documentShare.findUnique({
    where: { token },
    select: {
      documentId: true,
      expiresAt: true,
    },
  });

  if (!share) {
    return error('Share link not found', 404, 'SHARE_NOT_FOUND');
  }

  if (new Date() > share.expiresAt) {
    return error('Share link has expired', 410, 'SHARE_EXPIRED');
  }

  const comments = await db.documentComment.findMany({
    where: { documentId: share.documentId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      authorName: true,
      content: true,
      quote: true,
      position: true,
      resolved: true,
      createdAt: true,
    },
  });

  return success(comments);
}

// POST /api/shared/[token]/comments — Add a comment to a shared document
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;

  const share = await db.documentShare.findUnique({
    where: { token },
    select: {
      documentId: true,
      expiresAt: true,
      permission: true,
    },
  });

  if (!share) {
    return error('Share link not found', 404, 'SHARE_NOT_FOUND');
  }

  if (new Date() > share.expiresAt) {
    return error('Share link has expired', 410, 'SHARE_EXPIRED');
  }

  if (share.permission !== 'COMMENT') {
    return error('This share link does not allow comments', 403, 'FORBIDDEN');
  }

  try {
    const body = await request.json();
    const parsed = CreateCommentSchema.safeParse(body);

    if (!parsed.success) {
      return error(
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const { authorName, content, quote, position } = parsed.data;

    const comment = await db.documentComment.create({
      data: {
        documentId: share.documentId,
        authorName,
        content,
        quote,
        position,
        resolved: false,
      },
    });

    // Notify document owner about new comment
    const doc = await db.document.findUnique({
      where: { id: share.documentId },
      select: { userId: true, title: true },
    });
    if (doc) {
      notifyDocumentComment(doc.userId, doc.title, authorName, share.documentId).catch(() => {});
    }

    return success(comment, 201);
  } catch (err) {
    logger.error('Comment creation error', err);
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
