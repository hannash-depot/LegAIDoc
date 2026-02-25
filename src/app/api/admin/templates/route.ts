import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const categories = await db.templateCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        templates: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            version: true,
            isActive: true,
            sortOrder: true,
            createdAt: true,
            updatedAt: true,
            categoryId: true,
          },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching admin templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, categoryId, name, description, definition, sortOrder } = body;

    if (!slug || !categoryId || !name || !definition) {
      return NextResponse.json(
        { error: "Missing required fields: slug, categoryId, name, definition" },
        { status: 400 }
      );
    }

    const existing = await db.contractTemplate.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A template with this slug already exists" },
        { status: 409 }
      );
    }

    const template = await db.contractTemplate.create({
      data: {
        slug,
        categoryId,
        name,
        description: description || { he: "", ar: "", en: "", ru: "" },
        definition,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
