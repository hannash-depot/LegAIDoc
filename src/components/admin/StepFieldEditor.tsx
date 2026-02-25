"use client";

import { LocalizedInput } from "./LocalizedInput";
import type { TemplateField, LocalizedString, FieldType } from "@/types/template";

const emptyLocalized: LocalizedString = { he: "", ar: "", en: "", ru: "" };

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select" },
  { value: "multi-select", label: "Multi-select" },
  { value: "radio", label: "Radio" },
  { value: "checkbox", label: "Checkbox" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "id-number", label: "ID Number" },
  { value: "currency", label: "Currency" },
];

interface StepFieldEditorProps {
  field: TemplateField;
  onChange: (field: TemplateField) => void;
  onDelete: () => void;
}

export function StepFieldEditor({ field, onChange, onDelete }: StepFieldEditorProps) {
  return (
    <div className="p-3 bg-surface rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="grid grid-cols-2 gap-3 flex-1">
          <div>
            <label className="block text-xs text-text-muted mb-1">Field Key</label>
            <input
              type="text"
              value={field.key}
              onChange={(e) =>
                onChange({
                  ...field,
                  key: e.target.value.replace(/[^a-z0-9_]/gi, "_").toLowerCase(),
                })
              }
              placeholder="field_key"
              className="w-full px-2 py-1.5 text-sm border border-border rounded font-mono focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Type</label>
            <select
              value={field.type}
              onChange={(e) => onChange({ ...field, type: e.target.value as FieldType })}
              className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary/20"
            >
              {FIELD_TYPES.map((ft) => (
                <option key={ft.value} value={ft.value}>
                  {ft.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-error hover:text-error/80 ms-2 mt-4"
        >
          x
        </button>
      </div>

      <LocalizedInput
        label="Label"
        value={field.label}
        onChange={(label) => onChange({ ...field, label })}
        required
      />

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onChange({ ...field, required: e.target.checked })}
            className="rounded"
          />
          Required
        </label>
        <div>
          <select
            value={field.width ?? "full"}
            onChange={(e) =>
              onChange({ ...field, width: e.target.value as "full" | "half" })
            }
            className="px-2 py-1 text-xs border border-border rounded focus:outline-none"
          >
            <option value="full">Full Width</option>
            <option value="half">Half Width</option>
          </select>
        </div>
      </div>

      {(field.type === "select" || field.type === "radio" || field.type === "multi-select") && (
        <div>
          <label className="block text-xs text-text-muted mb-1">
            Options (one per line, format: value|English label)
          </label>
          <textarea
            value={(field.options ?? [])
              .map((o) => `${o.value}|${o.label.en}`)
              .join("\n")}
            onChange={(e) => {
              const options = e.target.value
                .split("\n")
                .filter(Boolean)
                .map((line) => {
                  const [value, label] = line.split("|");
                  return {
                    value: value?.trim() ?? "",
                    label: {
                      he: label?.trim() ?? value?.trim() ?? "",
                      ar: label?.trim() ?? value?.trim() ?? "",
                      en: label?.trim() ?? value?.trim() ?? "",
                      ru: label?.trim() ?? value?.trim() ?? "",
                    },
                  };
                });
              onChange({ ...field, options });
            }}
            rows={3}
            placeholder="apartment|Apartment&#10;house|House"
            className="w-full px-2 py-1.5 text-sm border border-border rounded font-mono focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
      )}
    </div>
  );
}
