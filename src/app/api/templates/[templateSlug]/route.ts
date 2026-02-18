import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    return NextResponse.json(template);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}
