import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";

type RouteParams = {
  params: Promise<{ templateId: string; versionId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { templateId, versionId } = await params;

  const version = await db.contractTemplateVersion.findFirst({
    where: {
      id: versionId,
      templateId,
    },
  });

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  return NextResponse.json(version);
}
