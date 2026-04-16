import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { DirectionSync } from '@/components/layout/direction-sync';
import { CookieConsent } from '@/components/layout/cookie-consent';

export const metadata: Metadata = {
  title: {
    default: 'LegAIDoc — חוזים דו-לשוניים בדקות',
    template: '%s | LegAIDoc',
  },
  description:
    'צור חוזי שכירות תקפים משפטית בעברית וערבית תוך דקות. פלטפורמת מסמכים משפטיים חכמה לישראל.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'LegAIDoc — חוזים דו-לשוניים בדקות',
    description: 'צור חוזי שכירות תקפים משפטית בעברית וערבית תוך דקות.',
    siteName: 'LegAIDoc',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <DirectionSync />
      {children}
      <CookieConsent />
    </NextIntlClientProvider>
  );
}
