"use client";

import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { useLocale } from "next-intl";
import { useState, useRef, useEffect } from "react";
import type { Locale } from "@/lib/i18n/routing";

const localeLabels: Record<Locale, string> = {
  he: "עברית",
  ar: "العربية",
  en: "English",
  ru: "Русский",
};

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function switchLocale(newLocale: Locale) {
    setOpen(false);
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-surface-hover transition-colors"
        aria-label="Switch language"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          />
        </svg>
        <span>{localeLabels[locale]}</span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1 end-0 bg-white border border-border rounded-lg shadow-lg py-1 min-w-[140px] z-50">
          {(Object.entries(localeLabels) as [Locale, string][]).map(
            ([code, label]) => (
              <button
                key={code}
                onClick={() => switchLocale(code)}
                className={`w-full text-start px-4 py-2 text-sm hover:bg-surface-hover transition-colors ${
                  code === locale
                    ? "text-primary font-medium bg-primary/5"
                    : "text-text"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
