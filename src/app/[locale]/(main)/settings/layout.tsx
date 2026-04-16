import { getTranslations } from 'next-intl/server';
import { SidebarNav } from './_components/sidebar-nav';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const tAccount = await getTranslations('account');
  const tBilling = await getTranslations('billing');

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="space-y-0.5">
        <h1 className="text-3xl font-bold tracking-tight">{tAccount('settings')}</h1>
        <p className="text-muted-foreground">
          {tAccount('profileDescription')} — {tBilling('description')}
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <aside className="lg:w-1/5">
          <SidebarNav />
        </aside>
        <div className="flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
