import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { z } from "zod";

const CreateTemplateSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  categorySlug: z.string().min(1),
  name: z.object({ he: z.string(), ar: z.string(), en: z.string(), ru: z.string() }),
  description: z.object({ he: z.string(), ar: z.string(), en: z.string(), ru: z.string() }),
  definition: z.record(z.string(), z.unknown()),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const templates = await db.contractTemplate.findMany({
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { slug: "asc" }],
  });

  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { slug, categorySlug, name, description, definition, isActive } = parsed.data;

  const category = await db.templateCategory.findUnique({ where: { slug: categorySlug } });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 400 });
  }

  try {
    const template = await db.contractTemplate.create({
      data: {
        slug,
        categoryId: category.id,
        name: name as never,
        description: description as never,
        definition: definition as never,
        isActive,
      },
      include: { category: true },
    });
    return NextResponse.json(template, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Template slug already exists" }, { status: 409 });
    }
    throw err;
  }
}
