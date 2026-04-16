'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { LocaleSwitcher } from './locale-switcher';
import { Button } from '@/components/ui/button';
import { signOut, useSession } from 'next-auth/react';
import { FileText, FolderOpen, Home, LogOut, Settings, Shield } from 'lucide-react';
import { FEATURE_NOTIFICATIONS } from '@/lib/feature-flags';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { cn } from '@/lib/utils/cn';
import { SiteLogo } from './site-logo';

interface HeaderProps {
  logoUrl?: string;
  logoHeight?: number;
}

export function Header({ logoUrl, logoHeight }: HeaderProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { href: '/dashboard' as const, label: t('nav.dashboard'), icon: Home },
    { href: '/templates' as const, label: t('nav.templates'), icon: FolderOpen },
    { href: '/documents' as const, label: t('nav.documents'), icon: FileText },
  ];

  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <header className="glass-header w-full">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
          {logoUrl ? (
            <SiteLogo logoUrl={logoUrl} height={logoHeight} />
          ) : (
            <span className="text-primary text-xl font-bold">LegAIDoc</span>
          )}
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1" aria-label={t('nav.mainNav') || 'Main navigation'}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href={'/admin' as string & {}}
              className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.admin')}</span>
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          {session?.user && (
            <div className="flex items-center gap-3">
              {FEATURE_NOTIFICATIONS && <NotificationBell />}
              <span className="text-muted-foreground hidden text-sm sm:inline">
                {session.user.name}
              </span>
              <Link
                href={'/settings' as string & {}}
                className={cn(
                  'hover:bg-accent hover:text-foreground inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                  pathname === '/settings' ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                )}
                aria-label={t('nav.settings')}
              >
                <Settings className="h-4 w-4" />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut({ callbackUrl: '/login' })}
                aria-label={t('nav.logout')}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
