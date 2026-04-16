import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api/require-admin';
import { success, error } from '@/lib/api/response';
import { parsePagination, paginationMeta } from '@/lib/api/pagination';
import { TemplateCreateSchema } from '@/schemas/template';

// TMPL-01: GET list templates (admin)
export async function GET(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = request.nextUrl;
  const pagination = parsePagination(searchParams);
  const status = searchParams.get('status'); // 'active' | 'inactive'

  const where =
    status === 'active' ? { isActive: true } : status === 'inactive' ? { isActive: false } : {};

  const [templates, total] = await Promise.all([
    db.template.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
      include: {
        category: {
          select: { id: true, slug: true, nameEn: true, nameHe: true, nameAr: true, nameRu: true },
        },
        _count: { select: { documents: true } },
      },
    }),
    db.template.count({ where }),
  ]);

  return success({
    items: templates,
    ...paginationMeta(total, pagination),
  });
}

// TMPL-02: POST create template
export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = TemplateCreateSchema.safeParse(body);

    if (!parsed.success) {
      return error(
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        400,
        'VALIDATION_ERROR',
      );
    }

    // TMPL-03: Check duplicate slug
    const existing = await db.template.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (existing) {
      return error('Template with this slug already exists', 409, 'SLUG_EXISTS');
    }

    // Verify category exists
    const category = await db.category.findUnique({
      where: { id: parsed.data.categoryId },
    });
    if (!category) {
      return error('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    const template = await db.template.create({
      data: {
        slug: parsed.data.slug,
        nameHe: parsed.data.nameHe,
        nameAr: parsed.data.nameAr,
        nameEn: parsed.data.nameEn,
        nameRu: parsed.data.nameRu,
        descHe: parsed.data.descHe,
        descAr: parsed.data.descAr,
        descEn: parsed.data.descEn,
        descRu: parsed.data.descRu,
        categoryId: parsed.data.categoryId,
        definition: JSON.parse(JSON.stringify(parsed.data.definition)),
        // TMPL-03: defaults version=1, isActive=true via schema
      },
    });

    return success(template, 201);
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
