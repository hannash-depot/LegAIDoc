import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api/require-admin';
import { success, error } from '@/lib/api/response';
import { CategoryCreateSchema } from '@/schemas/category';

// TCAT-01: GET all categories ordered by sortOrder ASC
export async function GET() {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const categories = await db.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { templates: true } },
    },
  });

  return success(categories);
}

// TCAT-02: POST create category
export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = CategoryCreateSchema.safeParse(body);

    if (!parsed.success) {
      return error(
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        400,
        'VALIDATION_ERROR',
      );
    }

    // TCAT-03: Check duplicate slug
    const existing = await db.category.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (existing) {
      return error('Category with this slug already exists', 409, 'SLUG_EXISTS');
    }

    const category = await db.category.create({
      data: parsed.data,
    });

    return success(category, 201);
  } catch {
    return error('Internal server error', 500, 'INTERNAL_ERROR');
  }
}
