"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/lib/i18n/routing";

interface TemplatePreviewProps {
  templateId: string;
}

const LOCALE_LABELS: Record<Locale, string> = {
  he: "Hebrew",
  ar: "Arabic",
  en: "English",
  ru: "Russian",
};

export function TemplatePreview({ templateId }: TemplatePreviewProps) {
  const t = useTranslations("admin.templates");
  const [locale, setLocale] = useState<Locale>("en");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPreview = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/templates/${templateId}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, sampleData: {} }),
      });

      if (!res.ok) throw new Error("Failed to load preview");

      const data = await res.json();
      setHtml(data.html);
    } catch {
      setError("Failed to generate preview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {(["he", "ar", "en", "ru"] as Locale[]).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocale(loc)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                locale === loc
                  ? "bg-primary text-white"
                  : "bg-surface text-text-secondary hover:bg-surface-hover"
              }`}
            >
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={loadPreview}
          disabled={loading}
          className="px-4 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "Loading..." : "Generate Preview"}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-error/10 text-error text-sm rounded-lg">{error}</div>
      )}

      {html ? (
        <div
          className="p-6 bg-white border border-border rounded-xl prose prose-sm max-w-none"
          dir={locale === "he" || locale === "ar" ? "rtl" : "ltr"}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="text-center py-12 bg-surface rounded-xl border border-dashed border-border">
          <p className="text-sm text-text-muted">
            Click &quot;Generate Preview&quot; to see the rendered document.
          </p>
        </div>
      )}
    </div>
  );
}
