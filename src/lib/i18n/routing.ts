import { defineRouting } from "next-intl/routing";

export const locales = ["he", "ar", "en", "ru"] as const;
export type Locale = (typeof locales)[number];

export const rtlLocales: Locale[] = ["he", "ar"];

export function getDirection(locale: Locale): "rtl" | "ltr" {
  return rtlLocales.includes(locale) ? "rtl" : "ltr";
}

export const routing = defineRouting({
  locales,
  defaultLocale: "he",
  localePrefix: "always",
});
