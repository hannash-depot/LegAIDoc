"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LocalizedInput } from "./LocalizedInput";
import { StepFieldEditor } from "./StepFieldEditor";
import type { TemplateStep, TemplateField, LocalizedString } from "@/types/template";

const emptyLocalized: LocalizedString = { he: "", ar: "", en: "", ru: "" };

interface WizardStepsEditorProps {
  steps: TemplateStep[];
  onChange: (steps: TemplateStep[]) => void;
}

export function WizardStepsEditor({ steps, onChange }: WizardStepsEditorProps) {
  const t = useTranslations("admin.templates");
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const addStep = () => {
    const key = `step_${steps.length + 1}`;
    const newStep: TemplateStep = {
      key,
      title: { ...emptyLocalized },
      fields: [],
    };
    onChange([...steps, newStep]);
    setExpandedStep(key);
  };

  const updateStep = (index: number, step: TemplateStep) => {
    onChange(steps.map((s, i) => (i === index ? step : s)));
  };

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index));
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const items = [...steps];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
    onChange(items);
  };

  const addField = (stepIndex: number) => {
    const step = steps[stepIndex];
    const newField: TemplateField = {
      key: `field_${step.fields.length + 1}`,
      type: "text",
      label: { ...emptyLocalized },
      required: false,
      width: "full",
    };
    updateStep(stepIndex, {
      ...step,
      fields: [...step.fields, newField],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text">
          {t("wizardSteps")} ({steps.length})
        </h3>
        <button
          type="button"
          onClick={addStep}
          className="px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
        >
          + {t("addStep")}
        </button>
      </div>

      {steps.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-dashed border-border">
          <p className="text-sm text-text-muted mb-3">
            No wizard steps defined. Steps are the form screens customers fill in.
          </p>
          <button
            type="button"
            onClick={addStep}
            className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
          >
            + {t("addStep")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isExpanded = expandedStep === step.key;
            return (
              <div key={step.key} className="border border-border rounded-xl bg-white overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 bg-surface cursor-pointer hover:bg-surface-hover"
                  onClick={() => setExpandedStep(isExpanded ? null : step.key)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted text-sm">{isExpanded ? "v" : ">"}</span>
                    <span className="text-xs text-text-muted font-mono">{step.key}</span>
                    <span className="font-medium text-sm text-text">
                      {step.title.en || "Untitled Step"}
                    </span>
                    <span className="text-xs text-text-muted">
                      {step.fields.length} field(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => moveStep(index, "up")}
                      disabled={index === 0}
                      className="text-xs text-text-muted hover:text-text disabled:opacity-30"
                    >
                      up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(index, "down")}
                      disabled={index === steps.length - 1}
                      className="text-xs text-text-muted hover:text-text disabled:opacity-30"
                    >
                      dn
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="text-xs text-error hover:text-error/80"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-4 border-t border-border">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-text-muted mb-1">Step Key</label>
                        <input
                          type="text"
                          value={step.key}
                          onChange={(e) =>
                            updateStep(index, {
                              ...step,
                              key: e.target.value.replace(/[^a-z0-9_]/gi, "_").toLowerCase(),
                            })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-border rounded font-mono focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <LocalizedInput
                      label="Step Title"
                      value={step.title}
                      onChange={(title) => updateStep(index, { ...step, title })}
                      required
                    />

                    {step.description !== undefined && (
                      <LocalizedInput
                        label="Step Description"
                        value={step.description ?? { ...emptyLocalized }}
                        onChange={(description) =>
                          updateStep(index, { ...step, description })
                        }
                      />
                    )}

                    <div className="space-y-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-text">Fields</h4>
                        <button
                          type="button"
                          onClick={() => addField(index)}
                          className="text-xs text-primary hover:text-primary-dark font-medium"
                        >
                          + {t("addField")}
                        </button>
                      </div>

                      {step.fields.map((field, fieldIndex) => (
                        <StepFieldEditor
                          key={`${field.key}-${fieldIndex}`}
                          field={field}
                          onChange={(updated) => {
                            const fields = step.fields.map((f, fi) =>
                              fi === fieldIndex ? updated : f
                            );
                            updateStep(index, { ...step, fields });
                          }}
                          onDelete={() => {
                            const fields = step.fields.filter((_, fi) => fi !== fieldIndex);
                            updateStep(index, { ...step, fields });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
