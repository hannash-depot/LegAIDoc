export const locales = ['he', 'ar', 'en', 'ru'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'he';

const rtlLocales: ReadonlySet<string> = new Set(['he', 'ar']);

export function getDirection(locale: string): 'rtl' | 'ltr' {
  return rtlLocales.has(locale) ? 'rtl' : 'ltr';
}

export function isRTL(locale: string): boolean {
  return rtlLocales.has(locale);
}

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
