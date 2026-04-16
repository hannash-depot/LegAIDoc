'use client';

import { useSyncExternalStore, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

const COOKIE_CONSENT_KEY = 'legaidoc-cookie-consent';

function getSnapshot(): boolean {
  return !localStorage.getItem(COOKIE_CONSENT_KEY);
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export function CookieConsent() {
  const t = useTranslations('common');
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const handleAccept = useCallback(() => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    window.dispatchEvent(new StorageEvent('storage'));
  }, []);

  const handleDecline = useCallback(() => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    window.dispatchEvent(new StorageEvent('storage'));
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t('cookieConsent')}
      className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-50 border-t p-4 backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-muted-foreground text-center text-sm sm:text-start">
          {t('cookieConsent')}{' '}
          <Link href="/privacy" className="hover:text-foreground underline">
            {t('privacyPolicy')}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={handleDecline}>
            {t('cookieDecline')}
          </Button>
          <Button size="sm" onClick={handleAccept}>
            {t('cookieAccept')}
          </Button>
        </div>
      </div>
    </div>
  );
}
