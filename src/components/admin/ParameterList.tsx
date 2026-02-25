"use client";

import { useTranslations } from "next-intl";
import type { BindingParameter } from "@/types/admin-template";
import type { LocalizedString, FieldType } from "@/types/template";
import { extractParameterKeys } from "@/lib/templates/compiler";

const emptyLocalized: LocalizedString = { he: "", ar: "", en: "", ru: "" };

const PARAMETER_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "currency", label: "Currency" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "select", label: "Select" },
];

interface ParameterListProps {
  parameters: BindingParameter[];
  onChange: (parameters: BindingParameter[]) => void;
  bodyText?: string;
}

export function ParameterList({ parameters, onChange, bodyText }: ParameterListProps) {
  const t = useTranslations("admin.templates");

  const addParameter = () => {
    onChange([
      ...parameters,
      {
        key: "",
        label: { ...emptyLocalized },
        type: "text" as FieldType,
        required: true,
      },
    ]);
  };

  const updateParameter = (index: number, updates: Partial<BindingParameter>) => {
    const updated = parameters.map((p, i) => (i === index ? { ...p, ...updates } : p));
    onChange(updated);
  };

  const removeParameter = (index: number) => {
    onChange(parameters.filter((_, i) => i !== index));
  };

  const autoDetect = () => {
    if (!bodyText) return;
    const keys = extractParameterKeys(bodyText);
    const existingKeys = new Set(parameters.map((p) => p.key));
    const newParams = keys
      .filter((key) => !existingKeys.has(key))
      .map((key) => ({
        key,
        label: { he: key, ar: key, en: key, ru: key },
        type: "text" as FieldType,
        required: true,
      }));

    if (newParams.length > 0) {
      onChange([...parameters, ...newParams]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text">
          {t("parameters")}
        </label>
        <div className="flex gap-2">
          {bodyText && (
            <button
              type="button"
              onClick={autoDetect}
              className="text-xs text-primary hover:text-primary-dark"
            >
              Auto-detect from body
            </button>
          )}
          <button
            type="button"
            onClick={addParameter}
            className="text-xs text-primary hover:text-primary-dark font-medium"
          >
            + {t("addParameter")}
          </button>
        </div>
      </div>

      {parameters.length === 0 ? (
        <p className="text-xs text-text-muted p-3 bg-surface rounded-lg">
          {"No parameters defined. Parameters are {{placeholder}}-style variables used in the section body."}
        </p>
      ) : (
        <div className="space-y-2">
          {parameters.map((param, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-2 items-center p-2 bg-surface rounded-lg"
            >
              <input
                type="text"
                value={param.key}
                onChange={(e) =>
                  updateParameter(index, {
                    key: e.target.value.replace(/[^a-z0-9_]/gi, "_").toLowerCase(),
                  })
                }
                placeholder="key_name"
                className="px-2 py-1.5 text-sm border border-border rounded font-mono focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
              <select
                value={param.type}
                onChange={(e) =>
                  updateParameter(index, { type: e.target.value as FieldType })
                }
                className="px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary/20"
              >
                {PARAMETER_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={param.required}
                  onChange={(e) =>
                    updateParameter(index, { required: e.target.checked })
                  }
                  className="rounded"
                />
                Req.
              </label>
              <input
                type="text"
                value={param.defaultValue ?? ""}
                onChange={(e) =>
                  updateParameter(index, { defaultValue: e.target.value || undefined })
                }
                placeholder="Default"
                className="w-24 px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => removeParameter(index)}
                className="text-error hover:text-error/80 text-sm px-1"
                title="Remove"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
