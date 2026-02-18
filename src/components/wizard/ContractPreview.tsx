"use client";

import { useMemo } from "react";
import { useWizard } from "@/components/providers/WizardProvider";
import { renderDocument } from "@/lib/templates/engine";
import { getDirection, type Locale } from "@/lib/i18n/routing";

export function ContractPreview() {
  const { definition, data, locale } = useWizard();
  const loc = locale as Locale;
  const direction = getDirection(loc);

  const html = useMemo(() => {
    const sections = definition.documentBody[loc];
    if (!sections) return "";
    return renderDocument(sections, data);
  }, [definition.documentBody, data, loc]);

  return (
    <div
      className="bg-white border border-border rounded-xl shadow-sm overflow-hidden"
      dir={direction}
    >
      <div className="px-6 py-3 bg-surface border-b border-border">
        <h3 className="text-sm font-medium text-text-secondary">
          {locale === "he" ? "תצוגה מקדימה" : locale === "ar" ? "معاينة" : locale === "ru" ? "Предпросмотр" : "Preview"}
        </h3>
      </div>
      <div
        className="p-8 prose prose-sm max-w-none contract-preview"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <style jsx>{`
        .contract-preview :global(.unfilled) {
          background-color: #fef3c7;
          padding: 2px 4px;
          border-radius: 2px;
          color: #92400e;
          font-style: italic;
        }
        .contract-preview :global(.contract-section) {
          margin-bottom: 1.5rem;
        }
        .contract-preview :global(h2) {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #1e40af;
        }
        .contract-preview :global(p) {
          margin-bottom: 0.5rem;
          line-height: 1.7;
        }
        .contract-preview :global(table) {
          margin-top: 2rem;
        }
      `}</style>
    </div>
  );
}
