"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import type {
  TemplateDefinition,
  TemplateStep,
  TemplateField,
  FieldOption,
  DocumentSection,
} from "@/types/template";

const LOCALES = ["he", "ar", "en", "ru"] as const;
type Locale = (typeof LOCALES)[number];

const LOCALE_LABELS: Record<Locale, string> = {
  he: "עברית (HE)",
  ar: "العربية (AR)",
  en: "English (EN)",
  ru: "Русский (RU)",
};

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Text",
  textarea: "Text Area",
  number: "Number",
  date: "Date",
  select: "Dropdown",
  "multi-select": "Multi Select",
  radio: "Radio",
  checkbox: "Checkbox",
  email: "Email",
  phone: "Phone",
  "id-number": "ID Number",
  currency: "Currency",
};

interface DefinitionEditorProps {
  definition: TemplateDefinition;
  onChange: (definition: TemplateDefinition) => void;
}

type EditorSection = "steps" | "document";

export function DefinitionEditor({ definition, onChange }: DefinitionEditorProps) {
  const t = useTranslations("admin.editor");
  const locale = useLocale() as Locale;

  const [activeSection, setActiveSection] = useState<EditorSection>("steps");
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]));
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [docLocale, setDocLocale] = useState<Locale>(locale);

  const toggleStep = (index: number) => {
    const next = new Set(expandedSteps);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpandedSteps(next);
  };

  const toggleField = (key: string) => {
    const next = new Set(expandedFields);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedFields(next);
  };

  const updateStep = (stepIndex: number, updates: Partial<TemplateStep>) => {
    const steps = [...definition.steps];
    steps[stepIndex] = { ...steps[stepIndex], ...updates };
    onChange({ ...definition, steps });
  };

  const updateStepTitle = (stepIndex: number, lang: Locale, value: string) => {
    const step = definition.steps[stepIndex];
    updateStep(stepIndex, { title: { ...step.title, [lang]: value } });
  };

  const updateStepDescription = (stepIndex: number, lang: Locale, value: string) => {
    const step = definition.steps[stepIndex];
    const desc = step.description || { he: "", ar: "", en: "", ru: "" };
    updateStep(stepIndex, { description: { ...desc, [lang]: value } });
  };

  const updateField = (stepIndex: number, fieldIndex: number, updates: Partial<TemplateField>) => {
    const steps = [...definition.steps];
    const fields = [...steps[stepIndex].fields];
    fields[fieldIndex] = { ...fields[fieldIndex], ...updates };
    steps[stepIndex] = { ...steps[stepIndex], fields };
    onChange({ ...definition, steps });
  };

  const updateFieldLabel = (stepIndex: number, fieldIndex: number, lang: Locale, value: string) => {
    const field = definition.steps[stepIndex].fields[fieldIndex];
    updateField(stepIndex, fieldIndex, { label: { ...field.label, [lang]: value } });
  };

  const updateFieldPlaceholder = (stepIndex: number, fieldIndex: number, lang: Locale, value: string) => {
    const field = definition.steps[stepIndex].fields[fieldIndex];
    const ph = field.placeholder || { he: "", ar: "", en: "", ru: "" };
    updateField(stepIndex, fieldIndex, { placeholder: { ...ph, [lang]: value } });
  };

  const updateFieldOption = (
    stepIndex: number,
    fieldIndex: number,
    optIndex: number,
    lang: Locale,
    value: string
  ) => {
    const field = definition.steps[stepIndex].fields[fieldIndex];
    if (!field.options) return;
    const options = [...field.options];
    options[optIndex] = { ...options[optIndex], label: { ...options[optIndex].label, [lang]: value } };
    updateField(stepIndex, fieldIndex, { options });
  };

  const updateFieldOptionValue = (
    stepIndex: number,
    fieldIndex: number,
    optIndex: number,
    value: string
  ) => {
    const field = definition.steps[stepIndex].fields[fieldIndex];
    if (!field.options) return;
    const options = [...field.options];
    options[optIndex] = { ...options[optIndex], value };
    updateField(stepIndex, fieldIndex, { options });
  };

  const addFieldOption = (stepIndex: number, fieldIndex: number) => {
    const field = definition.steps[stepIndex].fields[fieldIndex];
    const options: FieldOption[] = [
      ...(field.options || []),
      { value: "", label: { he: "", ar: "", en: "", ru: "" } },
    ];
    updateField(stepIndex, fieldIndex, { options });
  };

  const removeFieldOption = (stepIndex: number, fieldIndex: number, optIndex: number) => {
    const field = definition.steps[stepIndex].fields[fieldIndex];
    if (!field.options) return;
    const options = field.options.filter((_, i) => i !== optIndex);
    updateField(stepIndex, fieldIndex, { options });
  };

  const updateDocSection = (lang: Locale, sectionIndex: number, updates: Partial<DocumentSection>) => {
    const body = { ...definition.documentBody };
    const sections = [...(body[lang] || [])];
    sections[sectionIndex] = { ...sections[sectionIndex], ...updates };
    body[lang] = sections;
    onChange({ ...definition, documentBody: body });
  };

  const addDocSection = (lang: Locale) => {
    const body = { ...definition.documentBody };
    const sections = [...(body[lang] || [])];
    sections.push({ title: "", body: "" });
    body[lang] = sections;
    onChange({ ...definition, documentBody: body });
  };

  const removeDocSection = (lang: Locale, sectionIndex: number) => {
    const body = { ...definition.documentBody };
    const sections = (body[lang] || []).filter((_, i) => i !== sectionIndex);
    body[lang] = sections;
    onChange({ ...definition, documentBody: body });
  };

  const moveDocSection = (lang: Locale, sectionIndex: number, direction: "up" | "down") => {
    const body = { ...definition.documentBody };
    const sections = [...(body[lang] || [])];
    const target = direction === "up" ? sectionIndex - 1 : sectionIndex + 1;
    if (target < 0 || target >= sections.length) return;
    [sections[sectionIndex], sections[target]] = [sections[target], sections[sectionIndex]];
    body[lang] = sections;
    onChange({ ...definition, documentBody: body });
  };

  const isRtl = (lang: Locale) => lang === "he" || lang === "ar";

  return (
    <div className="space-y-4">
      {/* Section Switcher */}
      <div className="flex gap-2 bg-surface rounded-lg p-1">
        <button
          onClick={() => setActiveSection("steps")}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeSection === "steps"
              ? "bg-white text-primary shadow-sm"
              : "text-text-secondary hover:text-text"
          }`}
        >
          {t("wizardSteps")}
          <span className="ml-1.5 text-xs text-text-muted">({definition.steps.length})</span>
        </button>
        <button
          onClick={() => setActiveSection("document")}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeSection === "document"
              ? "bg-white text-primary shadow-sm"
              : "text-text-secondary hover:text-text"
          }`}
        >
          {t("documentBody")}
        </button>
      </div>

      {/* === WIZARD STEPS SECTION === */}
      {activeSection === "steps" && (
        <div className="space-y-3">
          {definition.steps.map((step, stepIndex) => {
            const isExpanded = expandedSteps.has(stepIndex);
            return (
              <div key={step.key} className="bg-white border border-border rounded-xl overflow-hidden">
                {/* Step Header */}
                <button
                  onClick={() => toggleStep(stepIndex)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-hover/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {stepIndex + 1}
                    </span>
                    <div className="text-left">
                      <h4 className="font-semibold text-text text-sm">
                        {step.title[locale] || step.title.en || step.key}
                      </h4>
                      <span className="text-xs text-text-muted">
                        {step.fields.length} {t("fields")} &middot; {step.key}
                      </span>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Step Content */}
                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 space-y-5">
                    {/* Step Titles */}
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                        {t("stepTitle")}
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {LOCALES.map((lang) => (
                          <div key={lang} className="flex items-center gap-2">
                            <span className="text-xs font-medium text-text-muted w-8 shrink-0">{lang.toUpperCase()}</span>
                            <input
                              type="text"
                              value={step.title[lang] || ""}
                              onChange={(e) => updateStepTitle(stepIndex, lang, e.target.value)}
                              dir={isRtl(lang) ? "rtl" : "ltr"}
                              className="flex-1 px-2.5 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step Descriptions */}
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                        {t("stepDescription")}
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {LOCALES.map((lang) => (
                          <div key={lang} className="flex items-center gap-2">
                            <span className="text-xs font-medium text-text-muted w-8 shrink-0">{lang.toUpperCase()}</span>
                            <input
                              type="text"
                              value={step.description?.[lang] || ""}
                              onChange={(e) => updateStepDescription(stepIndex, lang, e.target.value)}
                              dir={isRtl(lang) ? "rtl" : "ltr"}
                              className="flex-1 px-2.5 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fields */}
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                        {t("fields")}
                      </label>
                      <div className="space-y-2">
                        {step.fields.map((field, fieldIndex) => {
                          const fieldKey = `${stepIndex}-${fieldIndex}`;
                          const fieldExpanded = expandedFields.has(fieldKey);

                          return (
                            <div
                              key={field.key}
                              className="border border-border/60 rounded-lg overflow-hidden"
                            >
                              {/* Field Summary Row */}
                              <button
                                onClick={() => toggleField(fieldKey)}
                                className="w-full flex items-center justify-between px-4 py-2.5 bg-surface/30 hover:bg-surface/60 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-600 rounded uppercase">
                                    {FIELD_TYPE_LABELS[field.type] || field.type}
                                  </span>
                                  <span className="text-sm font-medium text-text">
                                    {field.label[locale] || field.label.en || field.key}
                                  </span>
                                  <code className="text-[10px] text-text-muted bg-surface px-1.5 py-0.5 rounded">
                                    {field.key}
                                  </code>
                                </div>
                                <div className="flex items-center gap-2">
                                  {field.required && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-50 text-red-500 rounded">
                                      {t("required")}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-text-muted">{field.width || "full"}</span>
                                  <svg
                                    className={`w-4 h-4 text-text-muted transition-transform ${fieldExpanded ? "rotate-180" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </button>

                              {/* Field Detail */}
                              {fieldExpanded && (
                                <div className="border-t border-border/60 px-4 py-3 space-y-3 bg-white">
                                  {/* Field Properties Row */}
                                  <div className="flex flex-wrap items-center gap-3">
                                    <label className="flex items-center gap-1.5 text-xs">
                                      <input
                                        type="checkbox"
                                        checked={field.required}
                                        onChange={(e) => updateField(stepIndex, fieldIndex, { required: e.target.checked })}
                                        className="w-3.5 h-3.5 text-primary rounded border-border"
                                      />
                                      <span className="text-text-secondary">{t("required")}</span>
                                    </label>
                                    <select
                                      value={field.width || "full"}
                                      onChange={(e) => updateField(stepIndex, fieldIndex, { width: e.target.value as "full" | "half" })}
                                      className="text-xs border border-border rounded px-2 py-1 bg-white"
                                    >
                                      <option value="full">{t("widthFull")}</option>
                                      <option value="half">{t("widthHalf")}</option>
                                    </select>
                                    {field.condition && (
                                      <span className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">
                                        {t("conditional")}: {field.condition.field} {field.condition.operator} {String(field.condition.value ?? "")}
                                      </span>
                                    )}
                                  </div>

                                  {/* Field Labels */}
                                  <div>
                                    <span className="text-xs font-medium text-text-muted mb-1 block">{t("fieldLabel")}</span>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                      {LOCALES.map((lang) => (
                                        <div key={lang} className="flex items-center gap-1.5">
                                          <span className="text-[10px] text-text-muted w-6 shrink-0">{lang.toUpperCase()}</span>
                                          <input
                                            type="text"
                                            value={field.label[lang] || ""}
                                            onChange={(e) => updateFieldLabel(stepIndex, fieldIndex, lang, e.target.value)}
                                            dir={isRtl(lang) ? "rtl" : "ltr"}
                                            className="flex-1 px-2 py-1 border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Placeholder */}
                                  {(field.placeholder || ["text", "textarea", "email", "phone"].includes(field.type)) && (
                                    <div>
                                      <span className="text-xs font-medium text-text-muted mb-1 block">{t("placeholder")}</span>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                        {LOCALES.map((lang) => (
                                          <div key={lang} className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-text-muted w-6 shrink-0">{lang.toUpperCase()}</span>
                                            <input
                                              type="text"
                                              value={field.placeholder?.[lang] || ""}
                                              onChange={(e) => updateFieldPlaceholder(stepIndex, fieldIndex, lang, e.target.value)}
                                              dir={isRtl(lang) ? "rtl" : "ltr"}
                                              className="flex-1 px-2 py-1 border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Validation */}
                                  {field.validation && (
                                    <div>
                                      <span className="text-xs font-medium text-text-muted mb-1 block">{t("validation")}</span>
                                      <div className="flex flex-wrap gap-2">
                                        {field.validation.min !== undefined && (
                                          <span className="text-[10px] bg-surface px-2 py-1 rounded">
                                            min: {field.validation.min}
                                          </span>
                                        )}
                                        {field.validation.max !== undefined && (
                                          <span className="text-[10px] bg-surface px-2 py-1 rounded">
                                            max: {field.validation.max}
                                          </span>
                                        )}
                                        {field.validation.minLength !== undefined && (
                                          <span className="text-[10px] bg-surface px-2 py-1 rounded">
                                            minLength: {field.validation.minLength}
                                          </span>
                                        )}
                                        {field.validation.maxLength !== undefined && (
                                          <span className="text-[10px] bg-surface px-2 py-1 rounded">
                                            maxLength: {field.validation.maxLength}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Options (for select, radio, multi-select) */}
                                  {field.options && (
                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-text-muted">{t("options")}</span>
                                        <button
                                          onClick={() => addFieldOption(stepIndex, fieldIndex)}
                                          className="text-[10px] text-primary hover:text-primary-dark font-medium"
                                        >
                                          + {t("addOption")}
                                        </button>
                                      </div>
                                      <div className="space-y-2">
                                        {field.options.map((opt, optIndex) => (
                                          <div key={optIndex} className="border border-border/40 rounded p-2 bg-surface/20">
                                            <div className="flex items-center gap-2 mb-1.5">
                                              <span className="text-[10px] text-text-muted">{t("value")}:</span>
                                              <input
                                                type="text"
                                                value={opt.value}
                                                onChange={(e) => updateFieldOptionValue(stepIndex, fieldIndex, optIndex, e.target.value)}
                                                className="flex-1 px-2 py-0.5 border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                                              />
                                              <button
                                                onClick={() => removeFieldOption(stepIndex, fieldIndex, optIndex)}
                                                className="text-red-400 hover:text-red-600 text-xs"
                                              >
                                                &times;
                                              </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-1">
                                              {LOCALES.map((lang) => (
                                                <div key={lang} className="flex items-center gap-1">
                                                  <span className="text-[10px] text-text-muted w-6 shrink-0">{lang.toUpperCase()}</span>
                                                  <input
                                                    type="text"
                                                    value={opt.label[lang] || ""}
                                                    onChange={(e) => updateFieldOption(stepIndex, fieldIndex, optIndex, lang, e.target.value)}
                                                    dir={isRtl(lang) ? "rtl" : "ltr"}
                                                    className="flex-1 px-1.5 py-0.5 border border-border rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/20"
                                                  />
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* === DOCUMENT BODY SECTION === */}
      {activeSection === "document" && (
        <div className="space-y-4">
          {/* Language Tabs */}
          <div className="flex gap-1 border-b border-border">
            {LOCALES.map((lang) => (
              <button
                key={lang}
                onClick={() => setDocLocale(lang)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  docLocale === lang
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary hover:text-text"
                }`}
              >
                {LOCALE_LABELS[lang]}
                <span className="ml-1.5 text-xs text-text-muted">
                  ({(definition.documentBody[docLocale] || []).length})
                </span>
              </button>
            ))}
          </div>

          {/* Sections for selected language */}
          <div className="space-y-3">
            {(definition.documentBody[docLocale] || []).map((section, sectionIndex) => (
              <div
                key={sectionIndex}
                className="bg-white border border-border rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {sectionIndex + 1}
                  </span>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateDocSection(docLocale, sectionIndex, { title: e.target.value })}
                    dir={isRtl(docLocale) ? "rtl" : "ltr"}
                    placeholder={t("sectionTitle")}
                    className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveDocSection(docLocale, sectionIndex, "up")}
                      disabled={sectionIndex === 0}
                      className="p-1 text-text-muted hover:text-text disabled:opacity-30"
                      title={t("moveUp")}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveDocSection(docLocale, sectionIndex, "down")}
                      disabled={sectionIndex === (definition.documentBody[docLocale] || []).length - 1}
                      className="p-1 text-text-muted hover:text-text disabled:opacity-30"
                      title={t("moveDown")}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeDocSection(docLocale, sectionIndex)}
                      className="p-1 text-red-400 hover:text-red-600"
                      title={t("removeSection")}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <textarea
                  value={section.body}
                  onChange={(e) => updateDocSection(docLocale, sectionIndex, { body: e.target.value })}
                  dir={isRtl(docLocale) ? "rtl" : "ltr"}
                  rows={5}
                  placeholder={t("sectionBody")}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                />
                {/* Template variables hint */}
                {section.body && /\{\{/.test(section.body) && (
                  <div className="flex flex-wrap gap-1">
                    {Array.from(section.body.matchAll(/\{\{([^#/}]+?)\}\}/g)).map(([, varName], i) => (
                      <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono">
                        {varName.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Add Section Button */}
            <button
              onClick={() => addDocSection(docLocale)}
              className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-text-secondary hover:border-primary hover:text-primary transition-colors"
            >
              + {t("addSection")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
