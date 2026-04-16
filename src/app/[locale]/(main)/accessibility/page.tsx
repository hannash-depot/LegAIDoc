import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function AccessibilityPage() {
  const t = await getTranslations('accessibility');
  const tc = await getTranslations('common');

  return (
    <div className="max-w-3xl">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href={'/' as '/templates'}>
          <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
          {tc('backToHome')}
        </Link>
      </Button>

      <article className="prose prose-sm dark:prose-invert max-w-3xl">
        <h1>{t('title')}</h1>

        <p>{t('intro')}</p>

        <h2>{t('conformance.title')}</h2>
        <ul>
          <li>{t('conformance.standard')}</li>
          <li>{t('conformance.level')}</li>
          <li>{t('conformance.lastReview')}</li>
        </ul>

        <h2>{t('measures.title')}</h2>
        <ul>
          <li>{t('measures.skipLink')}</li>
          <li>{t('measures.keyboard')}</li>
          <li>{t('measures.focusIndicators')}</li>
          <li>{t('measures.ariaLabels')}</li>
          <li>{t('measures.colorContrast')}</li>
          <li>{t('measures.responsiveDesign')}</li>
          <li>{t('measures.rtlSupport')}</li>
        </ul>

        <h2>{t('limitations.title')}</h2>
        <p>{t('limitations.description')}</p>

        <h2>{t('contact.title')}</h2>
        <p>{t('contact.description')}</p>
        <ul>
          <li>{t('contact.email')}</li>
        </ul>
      </article>
    </div>
  );
}
