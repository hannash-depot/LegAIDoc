import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';
import { logger } from '@/lib/logger';
import { CommentUpdateSchema } from '@/schemas/comment';

type RouteParams = { params: Promise<{ id: string; commentId: string }> };

// PATCH /api/documents/[id]/comments/[commentId] — Resolve or unresolve a comment
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  const { id, commentId } = await params;

  const document = await db.document.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!document) {
    return error('Document not found', 404, 'NOT_FOUND');
  }

  if (document.userId !== session!.user!.id) {
    return error('Forbidden', 403, 'FORBIDDEN');
  }

  try {
    const body = await request.json();
    const parsed = CommentUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return error(
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const comment = await db.documentComment.update({
      where: { id: commentId, documentId: id },
      data: { resolved: parsed.data.resolved },
    });

    return success(comment);
  } catch (err) {
    logger.error('Comment update error', err);
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

// DELETE /api/documents/[id]/comments/[commentId] — Delete a comment
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  const { id, commentId } = await params;

  const document = await db.document.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!document) {
    return error('Document not found', 404, 'NOT_FOUND');
  }

  if (document.userId !== session!.user!.id) {
    return error('Forbidden', 403, 'FORBIDDEN');
  }

  try {
    await db.documentComment.delete({
      where: { id: commentId, documentId: id },
    });

    return success({ deleted: true });
  } catch (err) {
    logger.error('Comment delete error', err);
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
