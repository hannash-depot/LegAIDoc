"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LocalizedInput } from "./LocalizedInput";
import { LocalizedTextarea } from "./LocalizedTextarea";
import { ConditionEditor } from "./ConditionEditor";
import { ParameterList } from "./ParameterList";
import { AdminBadge } from "./AdminBadge";
import type { TemplateSection, TemplateSubsection } from "@/types/admin-template";
import type { TemplateStep, LocalizedString } from "@/types/template";

const emptyLocalized: LocalizedString = { he: "", ar: "", en: "", ru: "" };

interface SectionEditorProps {
  section: TemplateSection;
  onChange: (section: TemplateSection) => void;
  onDelete: () => void;
  steps: TemplateStep[];
}

export function SectionEditor({ section, onChange, onDelete, steps }: SectionEditorProps) {
  const t = useTranslations("admin.templates");
  const [expanded, setExpanded] = useState(false);
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());

  const toggleSubExpanded = (id: string) => {
    setExpandedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addSubsection = () => {
    const newSub: TemplateSubsection = {
      id: crypto.randomUUID(),
      title: { ...emptyLocalized },
      body: { ...emptyLocalized },
      mandatory: false,
      sortOrder: section.subsections.length,
      parameters: [],
    };
    onChange({
      ...section,
      subsections: [...section.subsections, newSub],
    });
    setExpandedSubs((prev) => new Set(prev).add(newSub.id));
  };

  const updateSubsection = (index: number, sub: TemplateSubsection) => {
    const updated = section.subsections.map((s, i) => (i === index ? sub : s));
    onChange({ ...section, subsections: updated });
  };

  const removeSubsection = (index: number) => {
    onChange({
      ...section,
      subsections: section.subsections.filter((_, i) => i !== index),
    });
  };

  const moveSubsection = (index: number, direction: "up" | "down") => {
    const subs = [...section.subsections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= subs.length) return;
    [subs[index], subs[targetIndex]] = [subs[targetIndex], subs[index]];
    subs.forEach((s, i) => (s.sortOrder = i));
    onChange({ ...section, subsections: subs });
  };

  return (
    <div className="border border-border rounded-xl bg-white overflow-hidden">
      {/* Header - always visible */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-surface cursor-pointer hover:bg-surface-hover"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-text-muted text-sm">{expanded ? "v" : ">"}</span>
          <span className="font-medium text-sm text-text">
            {section.title.en || "Untitled Section"}
          </span>
          <AdminBadge variant={section.mandatory ? "mandatory" : "optional"}>
            {section.mandatory ? t("mandatory") : t("optional")}
          </AdminBadge>
          {section.condition && (
            <AdminBadge variant="info">Conditional</AdminBadge>
          )}
          {section.subsections.length > 0 && (
            <span className="text-xs text-text-muted">
              {section.subsections.length} subsection(s)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-error hover:text-error/80"
          >
            {t("common.delete") ?? "Delete"}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="p-4 space-y-5 border-t border-border">
          <LocalizedInput
            label={t("sectionTitle")}
            value={section.title}
            onChange={(title) => onChange({ ...section, title })}
            required
          />

          <LocalizedTextarea
            label={t("sectionBody")}
            value={section.body}
            onChange={(body) => onChange({ ...section, body })}
            helpText="Use {{field_key}} for placeholders. Use {{#if field}}...{{/if}} for conditionals."
            rows={6}
          />

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={section.mandatory}
                onChange={(e) => onChange({ ...section, mandatory: e.target.checked })}
                className="rounded"
              />
              {t("mandatory")}
            </label>
          </div>

          <ConditionEditor
            condition={section.condition}
            onChange={(condition) => onChange({ ...section, condition })}
            steps={steps}
          />

          <ParameterList
            parameters={section.parameters}
            onChange={(parameters) => onChange({ ...section, parameters })}
            bodyText={section.body.en}
          />

          {/* Subsections */}
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-text">Subsections</h4>
              <button
                type="button"
                onClick={addSubsection}
                className="text-xs text-primary hover:text-primary-dark font-medium"
              >
                + {t("addSubsection")}
              </button>
            </div>

            {section.subsections.length === 0 ? (
              <p className="text-xs text-text-muted p-3 bg-surface rounded-lg">
                No subsections. Click &quot;Add Subsection&quot; to add one.
              </p>
            ) : (
              <div className="space-y-2">
                {section.subsections.map((sub, index) => (
                  <div key={sub.id} className="border border-border rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between px-3 py-2 bg-surface/50 cursor-pointer hover:bg-surface"
                      onClick={() => toggleSubExpanded(sub.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">
                          {expandedSubs.has(sub.id) ? "v" : ">"}
                        </span>
                        <span className="text-sm text-text">
                          {sub.title.en || "Untitled Subsection"}
                        </span>
                        <AdminBadge variant={sub.mandatory ? "mandatory" : "optional"}>
                          {sub.mandatory ? t("mandatory") : t("optional")}
                        </AdminBadge>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => moveSubsection(index, "up")}
                          disabled={index === 0}
                          className="text-xs px-1 text-text-muted hover:text-text disabled:opacity-30"
                        >
                          up
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSubsection(index, "down")}
                          disabled={index === section.subsections.length - 1}
                          className="text-xs px-1 text-text-muted hover:text-text disabled:opacity-30"
                        >
                          dn
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSubsection(index)}
                          className="text-xs text-error hover:text-error/80 px-1"
                        >
                          x
                        </button>
                      </div>
                    </div>

                    {expandedSubs.has(sub.id) && (
                      <div className="p-3 space-y-4 border-t border-border">
                        <LocalizedInput
                          label="Subsection Title"
                          value={sub.title}
                          onChange={(title) => updateSubsection(index, { ...sub, title })}
                          required
                        />
                        <LocalizedTextarea
                          label="Subsection Body"
                          value={sub.body}
                          onChange={(body) => updateSubsection(index, { ...sub, body })}
                          rows={4}
                          helpText="Use {{field_key}} for placeholders."
                        />
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={sub.mandatory}
                            onChange={(e) =>
                              updateSubsection(index, { ...sub, mandatory: e.target.checked })
                            }
                            className="rounded"
                          />
                          {t("mandatory")}
                        </label>
                        <ConditionEditor
                          condition={sub.condition}
                          onChange={(condition) =>
                            updateSubsection(index, { ...sub, condition })
                          }
                          steps={steps}
                        />
                        <ParameterList
                          parameters={sub.parameters}
                          onChange={(parameters) =>
                            updateSubsection(index, { ...sub, parameters })
                          }
                          bodyText={sub.body.en}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
