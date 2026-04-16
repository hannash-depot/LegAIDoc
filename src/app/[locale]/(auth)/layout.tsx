import type { ReactNode } from 'react';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { SessionProvider } from 'next-auth/react';
import { LogoProvider } from '@/components/layout/logo-provider';
import { getLogoSettings } from '@/lib/settings/get-logo';

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const { logoUrl, logoHeight } = await getLogoSettings();

  return (
    <SessionProvider>
      <LogoProvider logoUrl={logoUrl} logoHeight={logoHeight}>
        <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
          <div className="absolute end-4 top-4">
            <LocaleSwitcher />
          </div>
          <div className="w-full max-w-md">{children}</div>
        </div>
      </LogoProvider>
    </SessionProvider>
  );
}
