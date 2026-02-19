import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TemplateEditorForm } from "../TemplateEditorForm";

export default async function NewTemplatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect(`/${locale}/dashboard`);

  const categories = await db.templateCategory.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/${locale}/admin/templates`}
          className="text-sm text-text-secondary hover:text-text transition-colors"
        >
          ← Back to templates
        </Link>
        <h1 className="text-2xl font-bold mt-2">New Template</h1>
      </div>

      <TemplateEditorForm
        locale={locale}
        categories={categories.map((cat) => ({
          id: cat.id,
          slug: cat.slug,
          name: cat.name as Record<string, string>,
        }))}
      />
    </div>
  );
}
