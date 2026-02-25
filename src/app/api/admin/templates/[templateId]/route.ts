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

const updateTemplateSchema = z.object({
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  categoryId: z.string().optional(),
  name: localizedStringSchema.optional(),
  description: localizedStringSchema.optional(),
  definition: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  changelog: z.string().optional(),
});

type RouteParams = { params: Promise<{ templateId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { templateId } = await params;

  const template = await db.contractTemplate.findUnique({
    where: { id: templateId },
    include: {
      category: { select: { id: true, slug: true, name: true } },
      versions: {
        orderBy: { version: "desc" },
        take: 10,
        select: {
          id: true,
          version: true,
          changelog: true,
          createdBy: true,
          createdAt: true,
        },
      },
      _count: { select: { documents: true } },
    },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json(template);
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { templateId } = await params;

  try {
    const body = await request.json();
    const data = updateTemplateSchema.parse(body);

    const existing = await db.contractTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugTaken = await db.contractTemplate.findUnique({
        where: { slug: data.slug },
      });
      if (slugTaken) {
        return NextResponse.json(
          { error: "A template with this slug already exists" },
          { status: 409 }
        );
      }
    }

    // If definition changed, bump version and create snapshot
    const definitionChanged = data.definition !== undefined;
    const newVersion = definitionChanged ? existing.version + 1 : existing.version;

    // Build typed update payload
    const updatePayload: Prisma.ContractTemplateUpdateInput = {};
    if (data.slug !== undefined) updatePayload.slug = data.slug;
    if (data.categoryId !== undefined)
      updatePayload.category = { connect: { id: data.categoryId } };
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.definition !== undefined)
      updatePayload.definition = data.definition as Prisma.InputJsonValue;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
    if (data.sortOrder !== undefined) updatePayload.sortOrder = data.sortOrder;
    if (definitionChanged) updatePayload.version = newVersion;

    const template = await db.contractTemplate.update({
      where: { id: templateId },
      data: updatePayload,
    });

    // Create version snapshot if definition changed
    if (definitionChanged && data.definition) {
      await db.contractTemplateVersion.create({
        data: {
          templateId: template.id,
          version: newVersion,
          name: data.name ?? (existing.name as Prisma.InputJsonValue),
          description:
            data.description ?? (existing.description as Prisma.InputJsonValue),
          definition: data.definition as Prisma.InputJsonValue,
          changelog: data.changelog ?? null,
          createdBy: session!.user.id,
        },
      });
    }

    return NextResponse.json(template);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { templateId } = await params;

  const template = await db.contractTemplate.findUnique({
    where: { id: templateId },
    include: { _count: { select: { documents: true } } },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  if (template._count.documents > 0) {
    // Soft delete if documents reference this template
    await db.contractTemplate.update({
      where: { id: templateId },
      data: { isActive: false },
    });
  } else {
    // Hard delete if no documents reference it
    await db.contractTemplateVersion.deleteMany({
      where: { templateId },
    });
    await db.contractTemplate.delete({
      where: { id: templateId },
    });
  }

  return NextResponse.json({ success: true });
}
