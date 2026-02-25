"use client";

import type { SectionCondition } from "@/types/admin-template";
import type { TemplateStep } from "@/types/template";
import { useTranslations } from "next-intl";

interface ConditionEditorProps {
  condition?: SectionCondition;
  onChange: (condition?: SectionCondition) => void;
  steps: TemplateStep[];
}

const OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "is_truthy", label: "Is Filled" },
  { value: "is_falsy", label: "Is Empty" },
  { value: "in", label: "In List" },
  { value: "not_in", label: "Not In List" },
] as const;

export function ConditionEditor({ condition, onChange, steps }: ConditionEditorProps) {
  const t = useTranslations("admin.templates");

  // Collect all field keys from all steps
  const allFields = steps.flatMap((step) =>
    step.fields.map((field) => ({
      key: field.key,
      label: field.label.en || field.key,
      stepLabel: step.title.en || step.key,
    }))
  );

  const hasCondition = !!condition;

  const toggleCondition = () => {
    if (hasCondition) {
      onChange(undefined);
    } else {
      onChange({
        field: allFields[0]?.key ?? "",
        operator: "is_truthy",
      });
    }
  };

  const needsValue =
    condition?.operator === "equals" ||
    condition?.operator === "not_equals" ||
    condition?.operator === "in" ||
    condition?.operator === "not_in";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-text">
          {t("condition")}
        </label>
        <button
          type="button"
          onClick={toggleCondition}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            hasCondition ? "bg-primary" : "bg-border"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              hasCondition ? "translate-x-4" : "translate-x-1"
            }`}
          />
        </button>
        <span className="text-xs text-text-muted">
          {hasCondition ? "" : t("noCondition")}
        </span>
      </div>

      {hasCondition && condition && (
        <div className="grid grid-cols-3 gap-2 p-3 bg-surface rounded-lg">
          <div>
            <label className="block text-xs text-text-muted mb-1">Field</label>
            <select
              value={condition.field}
              onChange={(e) => onChange({ ...condition, field: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary/20"
            >
              <option value="">Select field...</option>
              {allFields.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.stepLabel} / {f.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Operator</label>
            <select
              value={condition.operator}
              onChange={(e) =>
                onChange({
                  ...condition,
                  operator: e.target.value as SectionCondition["operator"],
                })
              }
              className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary/20"
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>
          {needsValue && (
            <div>
              <label className="block text-xs text-text-muted mb-1">Value</label>
              <input
                type="text"
                value={String(condition.value ?? "")}
                onChange={(e) => onChange({ ...condition, value: e.target.value })}
                placeholder="Value..."
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
