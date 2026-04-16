import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { Assistant, Frank_Ruhl_Libre } from 'next/font/google';
import { getDirection } from '@/lib/utils/locale';

import './globals.css';

const fontSans = Assistant({ subsets: ['latin', 'hebrew'], variable: '--font-sans' });
const fontSerif = Frank_Ruhl_Libre({ subsets: ['latin', 'hebrew'], variable: '--font-serif' });

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const locale = headersList.get('x-next-intl-locale') || 'he';
  const direction = getDirection(locale);

  return (
    <html
      lang={locale}
      dir={direction}
      className={`${fontSans.variable} ${fontSerif.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
