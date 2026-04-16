import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/audit-trail';

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/documents/[id]/duplicate — DOCM-03: Duplicate a document
export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const original = await db.document.findUnique({ where: { id } });

  if (!original) {
    return error('Document not found', 404, 'NOT_FOUND');
  }

  if (original.userId !== session!.user!.id) {
    return error('Forbidden', 403, 'FORBIDDEN');
  }

  const duplicate = await db.document.create({
    data: {
      title: `${original.title} (Copy)`,
      userId: session!.user!.id!,
      templateId: original.templateId,
      templateVersion: original.templateVersion,
      wizardData: JSON.parse(JSON.stringify(original.wizardData)),
      renderedBody: original.renderedBody,
      pdfUrl: original.pdfUrl,
      status: 'DRAFT',
      locale: original.locale,
    },
  });

  await logAudit('document.duplicated', 'document', duplicate.id, session!.user!.id!, {
    originalId: id,
  });

  return success(duplicate, 201);
}
