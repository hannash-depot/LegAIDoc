"use client";

import type { TemplateField } from "@/types/template";
import type { Locale } from "@/lib/i18n/routing";
import { useWizard } from "@/components/providers/WizardProvider";
import { evaluateCondition } from "@/lib/templates/engine";
import { cn } from "@/lib/utils/cn";

interface WizardFieldRendererProps {
  field: TemplateField;
  error?: string;
}

export function WizardFieldRenderer({ field, error }: WizardFieldRendererProps) {
  const { data, setFieldValue, locale } = useWizard();
  const loc = locale as Locale;

  // Handle conditional visibility
  if (field.condition) {
    const visible = evaluateCondition(field.condition, data);
    if (!visible) return null;
  }

  const value = data[field.key];
  const label = field.label[loc];
  const placeholder = field.placeholder?.[loc] ?? "";
  const helpText = field.helpText?.[loc];

  const wrapperClass = cn(
    "space-y-1.5",
    field.width === "half" ? "col-span-1" : "col-span-2"
  );

  const inputClass = cn(
    "w-full px-4 py-2.5 border rounded-lg transition-colors text-sm",
    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
    error ? "border-error" : "border-border"
  );

  const renderField = () => {
    switch (field.type) {
      case "text":
      case "phone":
      case "id-number":
      case "email":
        return (
          <input
            type={field.type === "email" ? "email" : "text"}
            value={(value as string) ?? ""}
            onChange={(e) => setFieldValue(field.key, e.target.value)}
            placeholder={placeholder}
            dir={field.type === "email" ? "ltr" : undefined}
            className={inputClass}
          />
        );

      case "textarea":
        return (
          <textarea
            value={(value as string) ?? ""}
            onChange={(e) => setFieldValue(field.key, e.target.value)}
            placeholder={placeholder}
            rows={4}
            className={inputClass}
          />
        );

      case "number":
      case "currency":
        return (
          <input
            type="number"
            value={value !== undefined && value !== null ? String(value) : ""}
            onChange={(e) => {
              const v = e.target.value;
              setFieldValue(field.key, v === "" ? undefined : Number(v));
            }}
            placeholder={placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            dir="ltr"
            className={inputClass}
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => setFieldValue(field.key, e.target.value)}
            dir="ltr"
            className={inputClass}
          />
        );

      case "select":
        return (
          <select
            value={(value as string) ?? ""}
            onChange={(e) => setFieldValue(field.key, e.target.value)}
            className={inputClass}
          >
            <option value="">{placeholder || "—"}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label[loc]}
              </option>
            ))}
          </select>
        );

      case "radio":
        return (
          <div className="flex flex-wrap gap-3">
            {field.options?.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors text-sm",
                  value === opt.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-surface-hover"
                )}
              >
                <input
                  type="radio"
                  name={field.key}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={() => setFieldValue(field.key, opt.value)}
                  className="sr-only"
                />
                {opt.label[loc]}
              </label>
            ))}
          </div>
        );

      case "multi-select":
        return (
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt) => {
              const selected = Array.isArray(value) && value.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors text-sm",
                    selected
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:bg-surface-hover"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      const arr = Array.isArray(value) ? [...value] : [];
                      if (selected) {
                        setFieldValue(
                          field.key,
                          arr.filter((v) => v !== opt.value)
                        );
                      } else {
                        setFieldValue(field.key, [...arr, opt.value]);
                      }
                    }}
                    className="sr-only"
                  />
                  {opt.label[loc]}
                </label>
              );
            })}
          </div>
        );

      case "checkbox":
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => setFieldValue(field.key, e.target.checked)}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary/20"
            />
            <span className="text-sm">{label}</span>
          </label>
        );

      default:
        return (
          <input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => setFieldValue(field.key, e.target.value)}
            className={inputClass}
          />
        );
    }
  };

  // Checkbox already includes its label
  if (field.type === "checkbox") {
    return (
      <div className={wrapperClass}>
        {renderField()}
        {helpText && <p className="text-xs text-text-muted">{helpText}</p>}
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <label className="block text-sm font-medium">
        {label}
        {field.required && <span className="text-error ms-1">*</span>}
      </label>
      {renderField()}
      {helpText && <p className="text-xs text-text-muted">{helpText}</p>}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
