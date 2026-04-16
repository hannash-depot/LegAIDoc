import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['he', 'ar', 'en', 'ru'],
  defaultLocale: 'he',
  localePrefix: 'always',
});
