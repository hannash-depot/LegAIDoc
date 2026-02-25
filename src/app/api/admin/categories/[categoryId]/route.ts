import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";

const localizedStringSchema = z.object({
  he: z.string().min(1),
  ar: z.string().min(1),
  en: z.string().min(1),
  ru: z.string().min(1),
});

const updateCategorySchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
  name: localizedStringSchema.optional(),
  description: localizedStringSchema.optional(),
  icon: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

type RouteParams = { params: Promise<{ categoryId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { categoryId } = await params;

  const category = await db.templateCategory.findUnique({
    where: { id: categoryId },
    include: {
      _count: { select: { templates: true } },
    },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json(category);
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { categoryId } = await params;

  try {
    const body = await request.json();
    const data = updateCategorySchema.parse(body);

    const existing = await db.templateCategory.findUnique({
      where: { id: categoryId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugTaken = await db.templateCategory.findUnique({
        where: { slug: data.slug },
      });
      if (slugTaken) {
        return NextResponse.json(
          { error: "A category with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const category = await db.templateCategory.update({
      where: { id: categoryId },
      data,
    });

    return NextResponse.json(category);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { categoryId } = await params;

  const category = await db.templateCategory.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { templates: true } } },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (category._count.templates > 0) {
    // Soft delete if templates exist
    await db.templateCategory.update({
      where: { id: categoryId },
      data: { isActive: false },
    });
  } else {
    await db.templateCategory.delete({
      where: { id: categoryId },
    });
  }

  return NextResponse.json({ success: true });
}
