import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/require-auth';
import { success, error } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/audit-trail';
import { logger } from '@/lib/logger';
import { ensureV1 } from '@/lib/templates/compiler';
import { renderTemplate } from '@/lib/templates/renderer';
import type { TemplateDefinitionType } from '@/schemas/template-definition';
import type { Locale } from '@/lib/utils/locale';
import { z } from 'zod/v4';

const UpdateDocumentSchema = z.object({
  wizardData: z.record(z.string(), z.unknown()),
  locale: z.enum(['he', 'ar', 'en', 'ru']).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/documents/[id] — Update a DRAFT document with new wizard data
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = UpdateDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return error(
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        400,
        'VALIDATION_ERROR',
      );
    }

    // Fetch existing document (only fields needed for auth + status check)
    const document = await db.document.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, templateId: true, locale: true },
    });

    if (!document) {
      return error('Document not found', 404, 'NOT_FOUND');
    }

    if (document.userId !== session!.user!.id) {
      return error('Forbidden', 403, 'FORBIDDEN');
    }

    // ESIG-12: Only DRAFT documents can be edited
    if (document.status !== 'DRAFT') {
      return error('Only draft documents can be edited', 400, 'NOT_DRAFT');
    }

    const { wizardData } = parsed.data;
    const locale = (parsed.data.locale || document.locale) as Locale;

    // Re-fetch template to re-render
    const template = await db.template.findUnique({
      where: { id: document.templateId, isActive: true },
    });

    if (!template) {
      return error('Template not found or inactive', 404, 'TEMPLATE_NOT_FOUND');
    }

    const definition = ensureV1(
      template.definition as unknown as TemplateDefinitionType,
      `${template.id}:${template.version}`,
    );
    const renderedBody = renderTemplate(definition, wizardData, locale);

    // Get localized title
    const nameKey =
      `name${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof typeof template;
    const title = (template[nameKey] as string) || template.nameEn;

    const updated = await db.document.update({
      where: { id },
      data: {
        title,
        wizardData: JSON.parse(JSON.stringify(wizardData)),
        renderedBody,
        locale,
      },
    });

    await logAudit('document.updated', 'document', id, session!.user!.id!);

    return success(updated);
  } catch (err) {
    logger.error('Document update error', err);
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

// GET /api/documents/[id] — Get document details
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const document = await db.document.findUnique({
    where: { id },
    include: {
      template: {
        select: { id: true, slug: true, nameEn: true, nameHe: true, nameAr: true, nameRu: true },
      },
      signatories: {
        select: { id: true, name: true, email: true, role: true, verifiedAt: true, signedAt: true },
      },
    },
  });

  if (!document) {
    return error('Document not found', 404, 'NOT_FOUND');
  }

  if (document.userId !== session!.user!.id) {
    return error('Forbidden', 403, 'FORBIDDEN');
  }

  await logAudit('document.read', 'document', id, session!.user!.id!);

  return success(document);
}

// DELETE /api/documents/[id] — DOCM-04: Delete DRAFT (hard), Archive PUBLISHED/SIGNED (soft)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

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

  // ESIG-12: Signed documents cannot be deleted
  if (document.status === 'SIGNED') {
    return error('Signed documents cannot be deleted', 400, 'DOCUMENT_SIGNED');
  }

  if (document.status === 'DRAFT') {
    // Hard-delete DRAFT documents
    await db.document.delete({ where: { id } });
    await logAudit('document.deleted', 'document', id, session!.user!.id!);
    return success({ deleted: true });
  } else {
    // Soft-delete: archive PUBLISHED/PENDING_SIGNATURE
    await db.document.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    await logAudit('document.archived', 'document', id, session!.user!.id!);
    return success({ archived: true });
  }
}
