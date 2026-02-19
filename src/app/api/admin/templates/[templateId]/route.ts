import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { z } from "zod";

const UpdateTemplateSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  categorySlug: z.string().min(1).optional(),
  name: z.object({ he: z.string(), ar: z.string(), en: z.string(), ru: z.string() }).optional(),
  description: z.object({ he: z.string(), ar: z.string(), en: z.string(), ru: z.string() }).optional(),
  definition: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return null;
  return session;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { templateId } = await params;
  const template = await db.contractTemplate.findUnique({
    where: { id: templateId },
    include: { category: true },
  });

  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(template);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { templateId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { categorySlug, ...rest } = parsed.data;

  let categoryId: string | undefined;
  if (categorySlug) {
    const category = await db.templateCategory.findUnique({ where: { slug: categorySlug } });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 400 });
    }
    categoryId = category.id;
  }

  try {
    const template = await db.contractTemplate.update({
      where: { id: templateId },
      data: {
        ...rest,
        ...(categoryId ? { categoryId } : {}),
        name: rest.name as never,
        description: rest.description as never,
        definition: rest.definition as never,
      },
      include: { category: true },
    });
    return NextResponse.json(template);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err) {
      const code = (err as { code: string }).code;
      if (code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (code === "P2002") return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { templateId } = await params;

  try {
    await db.contractTemplate.delete({ where: { id: templateId } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw err;
  }
}
