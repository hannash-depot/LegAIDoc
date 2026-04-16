'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { locales, type Locale } from '@/lib/utils/locale';

const localeLabels: Record<Locale, string> = {
  he: 'עברית',
  ar: 'العربية',
  en: 'English',
  ru: 'Русский',
};

export function LocaleSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value as Locale;
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <select
      value={currentLocale}
      onChange={handleChange}
      className="border-border bg-background text-foreground hover:bg-accent focus:ring-ring rounded-lg border px-2 py-1.5 text-sm transition-colors focus:ring-2 focus:outline-none"
      aria-label="Change language"
    >
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {localeLabels[locale]}
        </option>
      ))}
    </select>
  );
}
