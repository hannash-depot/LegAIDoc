import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api/require-admin';
import { success, error } from '@/lib/api/response';
import { TemplateUpdateSchema } from '@/schemas/template';

type RouteParams = { params: Promise<{ id: string }> };

// TMPL-05: GET single template with version summaries
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const template = await db.template.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, slug: true, nameEn: true, nameHe: true } },
      snapshots: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, version: true, changeNote: true, createdAt: true },
      },
      _count: { select: { documents: true } },
    },
  });

  if (!template) {
    return error('Template not found', 404, 'NOT_FOUND');
  }

  return success(template);
}

// TMPL-04: PUT update template
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error: authError } = await requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const existing = await db.template.findUnique({ where: { id } });
    if (!existing) {
      return error('Template not found', 404, 'NOT_FOUND');
    }

    const body = await request.json();
    const parsed = TemplateUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return error(
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        400,
        'VALIDATION_ERROR',
      );
    }

    // Check slug collision on update
    if (parsed.data.slug && parsed.data.slug !== existing.slug) {
      const slugExists = await db.template.findUnique({
        where: { slug: parsed.data.slug },
      });
      if (slugExists) {
        return error('Template with this slug already exists', 409, 'SLUG_EXISTS');
      }
    }

    // TMPL-04: Auto-increment version and create snapshot on definition change
    const definitionChanged = parsed.data.definition !== undefined;
    const newVersion = definitionChanged ? existing.version + 1 : existing.version;

    const updated = await db.$transaction(async (tx) => {
      if (definitionChanged) {
        await tx.templateSnapshot.create({
          data: {
            templateId: id,
            version: existing.version,
            definition: JSON.parse(JSON.stringify(existing.definition)),
            changeNote: `Auto-snapshot before v${newVersion} update`,
          },
        });
      }

      return tx.template.update({
        where: { id },
        data: {
          ...parsed.data,
          definition: parsed.data.definition
            ? JSON.parse(JSON.stringify(parsed.data.definition))
            : undefined,
          version: newVersion,
        },
      });
    });

    return success(updated);
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

// TMPL-07: DELETE template
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { error: authError } = await requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;

  const template = await db.template.findUnique({
    where: { id },
    include: { _count: { select: { documents: true } } },
  });

  if (!template) {
    return error('Template not found', 404, 'NOT_FOUND');
  }

  if (template._count.documents === 0) {
    // Hard delete with snapshots
    await db.$transaction([
      db.templateSnapshot.deleteMany({ where: { templateId: id } }),
      db.template.delete({ where: { id } }),
    ]);
  } else {
    // Soft delete
    await db.template.update({
      where: { id },
      data: { isActive: false },
    });
  }

  return success({ deleted: true });
}
