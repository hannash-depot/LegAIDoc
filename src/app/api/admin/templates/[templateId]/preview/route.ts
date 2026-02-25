import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { compileDefinition } from "@/lib/templates/compiler";
import { renderDocument } from "@/lib/templates/engine";
import type { Locale } from "@/lib/i18n/routing";

const LOCALES = ["he", "ar", "en", "ru"] as const;

const previewSchema = z.object({
  locale: z.string().refine((v): v is Locale => (LOCALES as readonly string[]).includes(v), {
    message: "Invalid locale",
  }),
  sampleData: z.record(z.string(), z.unknown()).optional(),
});

type RouteParams = { params: Promise<{ templateId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { templateId } = await params;

  try {
    const body = await request.json();
    const { locale, sampleData } = previewSchema.parse(body);

    const template = await db.contractTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const compiled = compileDefinition(template.definition as never);
    const sections = compiled.documentBody[locale];
    const html = renderDocument(sections, (sampleData ?? {}) as Record<string, unknown>);

    return NextResponse.json({ html });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    );
  }
}
