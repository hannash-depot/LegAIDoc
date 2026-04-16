'use client';

import { useTranslations } from 'next-intl';

/**
 * ACCS-04: "Skip to Content" link — first focusable element on every page.
 * Visually hidden until focused, then slides into view.
 */
export function SkipLink() {
  const t = useTranslations('accessibility');

  return (
    <a
      href="#main-content"
      className="bg-primary text-primary-foreground focus:ring-ring fixed start-4 top-2 z-[100] -translate-y-full rounded-lg px-4 py-2 text-sm font-medium shadow-lg transition-transform duration-200 focus:translate-y-0 focus:ring-2 focus:ring-offset-2 focus:outline-none"
    >
      {t('skipToContent')}
    </a>
  );
}
