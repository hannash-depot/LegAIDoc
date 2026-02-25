"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { renderDocument } from "@/lib/templates/engine";
import { getDirection, type Locale } from "@/lib/i18n/routing";
import type { TemplateDefinition } from "@/types/template";
import type { DocumentStatus } from "@/types/document";

interface DocData {
  id: string;
  title: string;
  status: DocumentStatus;
  locale: string;
  data: Record<string, unknown>;
  publishedAt: string | null;
  updatedAt: string;
  template: {
    slug: string;
    name: Record<string, string>;
    definition: TemplateDefinition;
  };
}

export default function DocumentViewPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const t = useTranslations("dashboard");
  const locale = useLocale() as Locale;
  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { documentId } = await params;
      const res = await fetch(`/api/documents/${documentId}`);
      if (res.ok) {
        setDoc(await res.json());
      }
      setLoading(false);
    }
    load();
  }, [params]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-center py-16">
        <p className="text-error">Document not found</p>
      </div>
    );
  }

  const definition = doc.template.definition;
  const sections = definition.documentBody[doc.locale as Locale] ?? definition.documentBody.he;
  const html = renderDocument(sections, doc.data, "______", {
    definition,
    locale: doc.locale as Locale,
  });
  const direction = getDirection(doc.locale as Locale);
  const localeMap: Record<string, string> = { he: "he-IL", ar: "ar-SA", en: "en-US", ru: "ru-RU" };

  async function handleDownload() {
    if (!doc) return;
    const res = await fetch(`/api/documents/${doc.id}/pdf`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-text-secondary hover:text-text mb-2 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t("title")}
          </Link>
          <h1 className="text-2xl font-bold">{doc.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {doc.status === "DRAFT" && (
            <Link
              href={`/wizard/${doc.template.slug}/0?doc=${doc.id}` as "/dashboard"}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover transition-colors"
            >
              {t("actions.edit")}
            </Link>
          )}
          {(doc.status === "PUBLISHED" || doc.status === "COMPLETED") && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t("actions.download")}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            doc.status === "PUBLISHED"
              ? "bg-success/10 text-success"
              : doc.status === "COMPLETED"
              ? "bg-primary/10 text-primary"
              : "bg-warning/10 text-warning"
          }`}
        >
          {t(`status.${doc.status}` as "status.DRAFT")}
        </span>
        <span className="text-sm text-text-muted">
          {t("lastUpdated")}: {new Date(doc.updatedAt).toLocaleDateString(localeMap[locale] || "en-US")}
        </span>
      </div>

      {/* Document preview */}
      <div
        className="bg-white border border-border rounded-2xl p-8"
        dir={direction}
      >
        <div
          className="prose prose-sm max-w-none contract-preview"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
