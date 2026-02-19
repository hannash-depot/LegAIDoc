import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { LocalizedString } from "@/types/template";

const createSchema = z.object({
  templateSlug: z.string().min(1),
  locale: z.enum(["he", "ar", "en", "ru"]).default("he"),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  try {
    const where: Record<string, unknown> = { userId: session.user.id };
    if (status) {
      where.status = status;
    }

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          template: {
            select: { slug: true, name: true, category: { select: { slug: true } } },
          },
        },
      }),
      db.document.count({ where }),
    ]);

    return NextResponse.json({
      documents,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { templateSlug, locale } = createSchema.parse(body);

    const template = await db.contractTemplate.findUnique({
      where: { slug: templateSlug },
    });

    if (!template || !template.isActive) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const templateName = template.name as unknown as LocalizedString;
    const title = templateName[locale as keyof LocalizedString] ?? templateName.he;

    const document = await db.document.create({
      data: {
        userId: session.user.id,
        templateId: template.id,
        templateVersion: template.version,
        title,
        locale,
        data: {},
        wizardProgress: { currentStep: 0, completedSteps: [] },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
