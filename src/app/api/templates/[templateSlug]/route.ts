import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { compileDefinition, isEnhancedDefinition } from "@/lib/templates/compiler";
import type { TemplateDefinition } from "@/types/template";
import type { EnhancedTemplateDefinition } from "@/types/admin-template";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ templateSlug: string }> }
) {
  try {
    const { templateSlug } = await params;

    const template = await db.contractTemplate.findUnique({
      where: { slug: templateSlug },
      include: {
        category: {
          select: { slug: true, name: true },
        },
      },
    });

    if (!template || !template.isActive) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Compile v2 definitions to v1 runtime format for the wizard/renderer
    const definition = template.definition as unknown as
      | EnhancedTemplateDefinition
      | TemplateDefinition;

    const compiledDefinition = isEnhancedDefinition(definition)
      ? compileDefinition(definition)
      : definition;

    return NextResponse.json({
      ...template,
      definition: compiledDefinition,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}
