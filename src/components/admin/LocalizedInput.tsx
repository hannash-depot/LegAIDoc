"use client";

import { useState } from "react";
import type { LocalizedString } from "@/types/template";
import type { Locale } from "@/lib/i18n/routing";

const LOCALE_LABELS: Record<Locale, string> = {
  he: "עברית",
  ar: "العربية",
  en: "English",
  ru: "Русский",
};

const LOCALES: Locale[] = ["he", "ar", "en", "ru"];

interface LocalizedInputProps {
  value: LocalizedString;
  onChange: (value: LocalizedString) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function LocalizedInput({
  value,
  onChange,
  label,
  placeholder,
  required,
  error,
}: LocalizedInputProps) {
  const [activeLocale, setActiveLocale] = useState<Locale>("en");

  const handleChange = (locale: Locale, text: string) => {
    onChange({ ...value, [locale]: text });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-text mb-1">
        {label}
        {required && <span className="text-error ms-1">*</span>}
      </label>
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex border-b border-border bg-surface">
          {LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => setActiveLocale(locale)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                activeLocale === locale
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:bg-surface-hover"
              }`}
            >
              {LOCALE_LABELS[locale]}
              {!value[locale] && (
                <span className="ms-1 text-warning">!</span>
              )}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={value[activeLocale] ?? ""}
          onChange={(e) => handleChange(activeLocale, e.target.value)}
          placeholder={placeholder}
          dir={activeLocale === "he" || activeLocale === "ar" ? "rtl" : "ltr"}
          className="w-full px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
