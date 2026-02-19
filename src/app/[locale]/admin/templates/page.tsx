import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TemplateActions } from "./TemplateActions";

export default async function AdminTemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect(`/${locale}/dashboard`);

  const templates = await db.contractTemplate.findMany({
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { slug: "asc" }],
  });

  // Group by category
  const byCategory = templates.reduce<
    Record<string, { name: Record<string, string>; templates: typeof templates }>
  >((acc, tpl) => {
    const cat = tpl.category;
    if (!acc[cat.slug]) {
      acc[cat.slug] = { name: cat.name as Record<string, string>, templates: [] };
    }
    acc[cat.slug].templates.push(tpl);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Contract Templates</h1>
          <p className="text-text-secondary mt-1">
            {templates.length} template{templates.length !== 1 ? "s" : ""} across{" "}
            {Object.keys(byCategory).length} categories
          </p>
        </div>
        <Link
          href={`/${locale}/admin/templates/new`}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
        >
          + New Template
        </Link>
      </div>

      <div className="space-y-8">
        {Object.entries(byCategory).map(([catSlug, { name, templates: catTemplates }]) => (
          <div key={catSlug}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-3">
              {(name as Record<string, string>).en ?? catSlug}
            </h2>
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="text-start px-4 py-3 font-medium text-text-secondary">Slug</th>
                    <th className="text-start px-4 py-3 font-medium text-text-secondary">Name (EN)</th>
                    <th className="text-start px-4 py-3 font-medium text-text-secondary">Steps</th>
                    <th className="text-start px-4 py-3 font-medium text-text-secondary">Status</th>
                    <th className="text-start px-4 py-3 font-medium text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {catTemplates.map((tpl) => {
                    const def = tpl.definition as { steps?: unknown[] } | null;
                    const stepCount = Array.isArray(def?.steps) ? def.steps.length : "—";
                    const tplName = tpl.name as Record<string, string>;
                    return (
                      <tr key={tpl.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                        <td className="px-4 py-3 font-mono text-xs text-text-secondary">{tpl.slug}</td>
                        <td className="px-4 py-3 font-medium">{tplName.en ?? "—"}</td>
                        <td className="px-4 py-3 text-text-secondary">{stepCount}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              tpl.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {tpl.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <TemplateActions
                            templateId={tpl.id}
                            isActive={tpl.isActive}
                            editHref={`/${locale}/admin/templates/${tpl.id}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="text-center py-16 text-text-secondary">
            <p className="mb-4">No templates yet.</p>
            <Link
              href={`/${locale}/admin/templates/new`}
              className="text-primary hover:underline"
            >
              Create the first template
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
