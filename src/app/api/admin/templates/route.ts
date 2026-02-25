import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";

const localizedStringSchema = z.object({
  he: z.string().min(1),
  ar: z.string().min(1),
  en: z.string().min(1),
  ru: z.string().min(1),
});

const createTemplateSchema = z.object({
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  categoryId: z.string().min(1),
  name: localizedStringSchema,
  description: localizedStringSchema,
  definition: z.record(z.string(), z.unknown()),
  sortOrder: z.number().int().min(0).optional(),
});

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  const status = searchParams.get("status") ?? "all";

  const where: Record<string, unknown> = {};

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (status === "active") {
    where.isActive = true;
  } else if (status === "inactive") {
    where.isActive = false;
  }

  const templates = await db.contractTemplate.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      category: { select: { id: true, slug: true, name: true } },
      _count: { select: { documents: true, versions: true } },
    },
  });

  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const data = createTemplateSchema.parse(body);

    const existing = await db.contractTemplate.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A template with this slug already exists" },
        { status: 409 }
      );
    }

    const category = await db.templateCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const definition = data.definition as Prisma.InputJsonValue;
    const template = await db.contractTemplate.create({
      data: {
        slug: data.slug,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        definition,
        version: 1,
        sortOrder: data.sortOrder ?? 0,
        isActive: true,
      },
    });

    // Create initial version snapshot
    await db.contractTemplateVersion.create({
      data: {
        templateId: template.id,
        version: 1,
        name: data.name,
        description: data.description,
        definition,
        changelog: "Initial version",
        createdBy: session!.user.id,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
