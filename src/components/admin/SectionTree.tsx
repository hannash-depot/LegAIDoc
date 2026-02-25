"use client";

import { useTranslations } from "next-intl";
import { SectionEditor } from "./SectionEditor";
import type { TemplateSection } from "@/types/admin-template";
import type { TemplateStep, LocalizedString } from "@/types/template";

const emptyLocalized: LocalizedString = { he: "", ar: "", en: "", ru: "" };

interface SectionTreeProps {
  sections: TemplateSection[];
  onChange: (sections: TemplateSection[]) => void;
  steps: TemplateStep[];
}

export function SectionTree({ sections, onChange, steps }: SectionTreeProps) {
  const t = useTranslations("admin.templates");

  const addSection = () => {
    const newSection: TemplateSection = {
      id: crypto.randomUUID(),
      title: { ...emptyLocalized },
      body: { ...emptyLocalized },
      mandatory: true,
      sortOrder: sections.length,
      parameters: [],
      subsections: [],
    };
    onChange([...sections, newSection]);
  };

  const updateSection = (index: number, section: TemplateSection) => {
    const updated = sections.map((s, i) => (i === index ? section : s));
    onChange(updated);
  };

  const removeSection = (index: number) => {
    onChange(sections.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const items = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
    items.forEach((s, i) => (s.sortOrder = i));
    onChange(items);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text">
          {t("documentSections")} ({sections.length})
        </h3>
        <button
          type="button"
          onClick={addSection}
          className="px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
        >
          + {t("addSection")}
        </button>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-dashed border-border">
          <p className="text-sm text-text-muted mb-3">
            No sections defined. Sections make up the document body of the contract.
          </p>
          <button
            type="button"
            onClick={addSection}
            className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
          >
            + {t("addSection")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) => (
            <div key={section.id} className="relative">
              <div className="absolute -start-8 top-3 flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveSection(index, "up")}
                  disabled={index === 0}
                  className="text-xs text-text-muted hover:text-text disabled:opacity-30 p-0.5"
                  title="Move up"
                >
                  ^
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(index, "down")}
                  disabled={index === sections.length - 1}
                  className="text-xs text-text-muted hover:text-text disabled:opacity-30 p-0.5"
                  title="Move down"
                >
                  v
                </button>
              </div>
              <SectionEditor
                section={section}
                onChange={(updated) => updateSection(index, updated)}
                onDelete={() => removeSection(index)}
                steps={steps}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
