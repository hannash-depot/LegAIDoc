import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/documents/[id]/comments — Fetch comments for a document
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

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

  const comments = await db.documentComment.findMany({
    where: { documentId: id },
    orderBy: { createdAt: 'desc' },
  });

  return success(comments);
}
