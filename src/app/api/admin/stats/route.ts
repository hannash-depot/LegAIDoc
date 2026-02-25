import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [totalTemplates, activeTemplates, totalCategories, totalDocuments, recentDocuments] =
    await Promise.all([
      db.contractTemplate.count(),
      db.contractTemplate.count({ where: { isActive: true } }),
      db.templateCategory.count(),
      db.document.count(),
      db.document.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

  return NextResponse.json({
    totalTemplates,
    activeTemplates,
    totalCategories,
    totalDocuments,
    recentDocuments,
  });
}
