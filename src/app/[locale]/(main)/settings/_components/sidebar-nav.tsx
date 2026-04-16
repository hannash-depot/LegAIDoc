/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils/cn';
import { useTranslations } from 'next-intl';
import { FEATURE_PAYMENTS } from '@/lib/feature-flags';

export function SidebarNav() {
  const t = useTranslations('billing');
  const pathname = usePathname();

  const items = [
    {
      href: '/settings',
      title: t('navProfile'),
    },
    ...(FEATURE_PAYMENTS
      ? [
          {
            href: '/settings/billing',
            title: t('navBilling'),
          },
        ]
      : []),
  ];

  return (
    <nav className="flex gap-2 lg:flex-col lg:gap-1" aria-label="Settings navigation">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href as any}
            className={cn(
              'hover:bg-accent hover:text-accent-foreground flex justify-start rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground',
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
