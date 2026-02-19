import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { TemplateEditorForm } from "../TemplateEditorForm";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ locale: string; templateId: string }>;
}) {
  const { locale, templateId } = await params;
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect(`/${locale}/dashboard`);

  const [template, categories] = await Promise.all([
    db.contractTemplate.findUnique({
      where: { id: templateId },
      include: { category: true },
    }),
    db.templateCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (!template) notFound();

  const tplName = template.name as Record<string, string>;
  const tplDesc = template.description as Record<string, string>;

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/${locale}/admin/templates`}
          className="text-sm text-text-secondary hover:text-text transition-colors"
        >
          ← Back to templates
        </Link>
        <h1 className="text-2xl font-bold mt-2">
          Edit: {tplName.en ?? template.slug}
        </h1>
      </div>

      <TemplateEditorForm
        locale={locale}
        categories={categories.map((cat) => ({
          id: cat.id,
          slug: cat.slug,
          name: cat.name as Record<string, string>,
        }))}
        initialData={{
          id: template.id,
          slug: template.slug,
          categorySlug: template.category.slug,
          name: {
            he: tplName.he ?? "",
            ar: tplName.ar ?? "",
            en: tplName.en ?? "",
            ru: tplName.ru ?? "",
          },
          description: {
            he: tplDesc.he ?? "",
            ar: tplDesc.ar ?? "",
            en: tplDesc.en ?? "",
            ru: tplDesc.ru ?? "",
          },
          definition: JSON.stringify(template.definition, null, 2),
          isActive: template.isActive,
        }}
      />
    </div>
  );
}
