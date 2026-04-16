'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils/cn';
import { FEATURE_AI_IMPORT, FEATURE_PAYMENTS } from '@/lib/feature-flags';
import {
  LayoutDashboard,
  FolderTree,
  FileCode2,
  Users,
  Files,
  CreditCard,
  Wand2,
  Settings,
} from 'lucide-react';

export function AdminSidebar() {
  const t = useTranslations('admin');
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: t('dashboard'), icon: LayoutDashboard, exact: true },
    { href: '/admin/categories', label: t('categories'), icon: FolderTree },
    { href: '/admin/templates', label: t('templates'), icon: FileCode2 },
    { href: '/admin/users', label: t('users'), icon: Users },
    { href: '/admin/documents', label: t('documents'), icon: Files },
    ...(FEATURE_PAYMENTS
      ? [{ href: '/admin/finance', label: t('finance'), icon: CreditCard }]
      : []),
    ...(FEATURE_AI_IMPORT ? [{ href: '/admin/ai-import', label: t('aiImport'), icon: Wand2 }] : []),
    { href: '/admin/settings', label: t('settings'), icon: Settings },
  ];

  return (
    <nav className="flex h-full flex-col gap-2 p-4">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === '/admin' ||
            pathname === '/he/admin' ||
            pathname === '/ar/admin' ||
            pathname === '/ru/admin'
          : pathname.includes(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
