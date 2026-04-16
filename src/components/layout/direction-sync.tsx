'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { getDirection } from '@/lib/utils/locale';

/**
 * Syncs the <html> element's `dir` and `lang` attributes
 * with the current locale on client-side navigation.
 * Root layout only sets these on initial server render.
 */
export function DirectionSync() {
  const locale = useLocale();

  useEffect(() => {
    const direction = getDirection(locale);
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
