'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold">{t('errorTitle')}</h1>
      <p className="text-muted-foreground max-w-md">{t('errorDescription')}</p>
      <Button onClick={reset}>{t('tryAgain')}</Button>
    </div>
  );
}
