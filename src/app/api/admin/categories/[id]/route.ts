import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api/require-admin';
import { success, error } from '@/lib/api/response';
import { CategoryUpdateSchema } from '@/schemas/category';

type RouteParams = { params: Promise<{ id: string }> };

// TCAT-03: GET single category
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const category = await db.category.findUnique({
    where: { id },
    include: { _count: { select: { templates: true } } },
  });

  if (!category) {
    return error('Category not found', 404, 'NOT_FOUND');
  }

  return success(category);
}

// TCAT-04: PUT update category
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) {
      return error('Category not found', 404, 'NOT_FOUND');
    }

    const body = await request.json();
    const parsed = CategoryUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return error(
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        400,
        'VALIDATION_ERROR',
      );
    }

    // Check slug collision on update
    if (parsed.data.slug && parsed.data.slug !== existing.slug) {
      const slugExists = await db.category.findUnique({
        where: { slug: parsed.data.slug },
      });
      if (slugExists) {
        return error('Category with this slug already exists', 409, 'SLUG_EXISTS');
      }
    }

    const updated = await db.category.update({
      where: { id },
      data: parsed.data,
    });

    return success(updated);
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

// TCAT-05: DELETE category
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;

  const category = await db.category.findUnique({
    where: { id },
    include: { _count: { select: { templates: true } } },
  });

  if (!category) {
    return error('Category not found', 404, 'NOT_FOUND');
  }

  if (category._count.templates === 0) {
    // Hard delete if no templates
    await db.category.delete({ where: { id } });
  } else {
    // Soft delete if templates exist
    await db.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  return success({ deleted: true });
}
