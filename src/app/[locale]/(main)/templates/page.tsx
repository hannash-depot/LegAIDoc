"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { useEffect, useState } from "react";

interface Template {
  id: string;
  slug: string;
  name: Record<string, string>;
  description: Record<string, string>;
  version: number;
}

interface Category {
  id: string;
  slug: string;
  name: Record<string, string>;
  description: Record<string, string>;
  icon: string | null;
  sortOrder: number;
  templates: Template[];
}

const iconMap: Record<string, string> = {
  rental: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  employment: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  business: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  default: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
};

export default function TemplatesPage() {
  const t = useTranslations("templates");
  const locale = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const response = await fetch("/api/templates");
      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setCategories(data);
    } catch {
      setError("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="py-12 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center py-16">
          <p className="text-error mb-4">{error}</p>
          <button
            onClick={fetchCategories}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            {useTranslations("common")("retry")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3">{t("title")}</h1>
          <p className="text-text-secondary">{t("subtitle")}</p>
        </div>

        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-2xl border border-border p-6">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d={iconMap[category.slug] || iconMap.default}
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">
                      {category.name[locale] || category.name.he}
                    </h2>
                    <p className="text-sm text-text-muted">
                      {category.templates.length} {t("templatesCount")}
                    </p>
                  </div>
                </div>
                <svg
                  className={`w-6 h-6 text-text-muted transition-transform ${
                    expandedCategory === category.id ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {expandedCategory === category.id && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.templates.map((template) => (
                    <Link
                      key={template.id}
                      href={`/wizard/${template.slug}`}
                      className="block p-4 border border-border rounded-lg hover:border-primary/30 hover:shadow-sm transition-all"
                    >
                      <h3 className="font-semibold mb-2">
                        {template.name[locale] || template.name.he}
                      </h3>
                      <p className="text-sm text-text-muted line-clamp-2">
                        {template.description[locale] || template.description.he}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
