import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ templateId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { templateId } = await params;

  const template = await db.contractTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const versions = await db.contractTemplateVersion.findMany({
    where: { templateId },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      changelog: true,
      createdBy: true,
      createdAt: true,
    },
  });

  return NextResponse.json(versions);
}
