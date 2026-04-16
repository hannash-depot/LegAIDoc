import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/**
 * ACCS-05: Footer with Accessibility Statement link on all pages.
 */
export function Footer() {
  const t = useTranslations('common');

  return (
    <footer className="border-border bg-background border-t py-6">
      <div className="text-muted-foreground mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-sm sm:flex-row sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} LegAIDoc</p>
        <nav aria-label={t('footerNav')}>
          <ul className="flex gap-4">
            <li>
              <Link
                href={'/terms' as '/templates'}
                className="hover:text-foreground focus-visible:text-foreground focus-visible:ring-ring transition-colors focus-visible:rounded focus-visible:ring-2 focus-visible:outline-none"
              >
                {t('termsOfService')}
              </Link>
            </li>
            <li>
              <Link
                href={'/privacy' as '/templates'}
                className="hover:text-foreground focus-visible:text-foreground focus-visible:ring-ring transition-colors focus-visible:rounded focus-visible:ring-2 focus-visible:outline-none"
              >
                {t('privacyPolicy')}
              </Link>
            </li>
            <li>
              <Link
                href={'/accessibility' as '/templates'}
                className="hover:text-foreground focus-visible:text-foreground focus-visible:ring-ring transition-colors focus-visible:rounded focus-visible:ring-2 focus-visible:outline-none"
              >
                {t('accessibilityStatement')}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="text-muted-foreground/80 mx-auto mt-6 max-w-7xl px-4 text-center text-xs sm:px-6">
        <p>{t('legalDisclaimer')}</p>
      </div>
    </footer>
  );
}
