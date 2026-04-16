import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api/require-admin';
import { success, error } from '@/lib/api/response';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit/audit-trail';
import { AdminDocumentUpdateSchema } from '@/schemas/document';
import { ensureV1 } from '@/lib/templates/compiler';
import { renderTemplate } from '@/lib/templates/renderer';
import type { TemplateDefinitionType } from '@/schemas/template-definition';
import type { Locale } from '@/lib/utils/locale';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/admin/documents/[id] — Fetch single document with all relations
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;

  const document = await db.document.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      template: {
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameHe: true,
          nameAr: true,
          nameRu: true,
          isActive: true,
          category: { select: { id: true, nameEn: true, nameHe: true } },
        },
      },
      signatories: {
        select: { id: true, name: true, email: true, role: true, verifiedAt: true, signedAt: true },
      },
    },
  });

  if (!document) {
    return error('Document not found', 404, 'NOT_FOUND');
  }

  return success(document);
}

// PUT /api/admin/documents/[id] — Admin update document
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error: authError, session } = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = AdminDocumentUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return error(
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const document = await db.document.findUnique({ where: { id } });
    if (!document) {
      return error('Document not found', 404, 'NOT_FOUND');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    if (parsed.data.title !== undefined) {
      changes.title = { from: document.title, to: parsed.data.title };
      updateData.title = parsed.data.title;
    }

    if (parsed.data.status !== undefined) {
      changes.status = { from: document.status, to: parsed.data.status };
      updateData.status = parsed.data.status;
    }

    if (parsed.data.locale !== undefined) {
      changes.locale = { from: document.locale, to: parsed.data.locale };
      updateData.locale = parsed.data.locale;
    }

    // If wizardData changed, re-render the template body
    if (parsed.data.wizardData !== undefined) {
      const template = await db.template.findUnique({
        where: { id: document.templateId },
      });

      if (!template) {
        return error('Template not found', 404, 'TEMPLATE_NOT_FOUND');
      }

      const locale = (parsed.data.locale || document.locale) as Locale;
      const definition = ensureV1(
        template.definition as unknown as TemplateDefinitionType,
        `${template.id}:${template.version}`,
      );
      const renderedBody = renderTemplate(definition, parsed.data.wizardData, locale);

      updateData.wizardData = JSON.parse(JSON.stringify(parsed.data.wizardData));
      updateData.renderedBody = renderedBody;
      // Clear cached PDF since content changed
      updateData.pdfUrl = null;
      updateData.documentHash = null;
      changes.wizardData = { from: '[previous]', to: '[updated]' };
    }

    const updated = await db.document.update({
      where: { id },
      data: updateData,
    });

    await logAudit('document.admin_updated', 'document', id, session!.user!.id!, { changes });

    return success(updated);
  } catch (err) {
    logger.error('Admin document update error', err);
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

// DELETE /api/admin/documents/[id] — Admin delete/archive document
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { error: authError, session } = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;

  const document = await db.document.findUnique({ where: { id } });
  if (!document) {
    return error('Document not found', 404, 'NOT_FOUND');
  }

  if (document.status === 'DRAFT') {
    await db.document.delete({ where: { id } });
    await logAudit('document.admin_deleted', 'document', id, session!.user!.id!);
    return success({ deleted: true });
  } else {
    await db.document.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    await logAudit('document.admin_archived', 'document', id, session!.user!.id!);
    return success({ archived: true });
  }
}
