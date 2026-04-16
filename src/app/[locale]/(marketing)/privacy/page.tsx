import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SECTIONS = [
  'introduction',
  'dataCollection',
  'dataUsage',
  'dataStorage',
  'cookies',
  'thirdPartyServices',
  'userRights',
  'israeliLaw',
  'dataRetention',
  'security',
  'children',
  'changes',
  'contact',
] as const;

export default async function PrivacyPage() {
  const t = await getTranslations('privacy');
  const tc = await getTranslations('common');

  return (
    <div className="container py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href={'/' as '/templates'}>
            <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
            {tc('backToHome')}
          </Link>
        </Button>

        <div className="border-border bg-card/50 rounded-xl border p-6 sm:p-10">
          <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">{t('title')}</h1>
          <p className="text-muted-foreground border-border mb-10 border-b pb-6 text-sm">
            {t('lastUpdated', { date: '2026-04-03' })}
          </p>

          <div className="space-y-8">
            {SECTIONS.map((section) => (
              <section
                key={section}
                className="border-border/50 bg-background/50 rounded-lg border p-5 sm:p-6"
              >
                <h2 className="mb-3 text-lg font-semibold">{t(`sections.${section}.title`)}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(`sections.${section}.content`)}
                </p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
