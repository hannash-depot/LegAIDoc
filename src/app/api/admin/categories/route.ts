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

const createCategorySchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  name: localizedStringSchema,
  description: localizedStringSchema,
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const categories = await db.templateCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { templates: true } },
    },
  });

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const data = createCategorySchema.parse(body);

    const existing = await db.templateCategory.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A category with this slug already exists" },
        { status: 409 }
      );
    }

    const category = await db.templateCategory.create({
      data: {
        slug: data.slug,
        name: data.name,
        description: data.description,
        icon: data.icon,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
