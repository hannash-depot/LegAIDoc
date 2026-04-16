import { SessionProvider } from 'next-auth/react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getLogoSettings } from '@/lib/settings/get-logo';
import type { ReactNode } from 'react';

export default async function MainLayout({ children }: { children: ReactNode }) {
  const { logoUrl, logoHeight } = await getLogoSettings();

  return (
    <SessionProvider>
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        {/* Ambient dynamic backgrounds */}
        <div className="bg-ambient bg-primary top-[-5%] left-[-10%] h-[500px] w-[50%]" />
        <div className="bg-ambient bottom[-10%] right-[-10%] h-[600px] w-[60%] bg-indigo-500/30 dark:bg-cyan-900/40" />

        <Header logoUrl={logoUrl} logoHeight={logoHeight} />
        <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
        <Footer />
      </div>
    </SessionProvider>
  );
}
