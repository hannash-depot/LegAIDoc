'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  Bell,
  FileSignature,
  FileCheck2,
  Clock,
  Share2,
  MessageSquare,
  Brain,
  CreditCard,
  AlertTriangle,
  BarChart3,
  FileEdit,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  titleKey: string;
  bodyKey: string;
  params: Record<string, string> | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const ICON_MAP: Record<string, typeof Bell> = {
  SIGNATURE_REQUESTED: FileSignature,
  SIGNATURE_COMPLETED: FileCheck2,
  SIGNATURE_EXPIRED: Clock,
  DOCUMENT_SHARED: Share2,
  DOCUMENT_COMMENT: MessageSquare,
  ANALYSIS_COMPLETE: Brain,
  PAYMENT_RECEIPT: CreditCard,
  SUBSCRIPTION_EXPIRING: AlertTriangle,
  USAGE_LIMIT_APPROACHING: BarChart3,
  ADMIN_TEMPLATE_UPDATED: FileEdit,
};

function formatRelativeTime(dateStr: string) {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return '<1m';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  return `${diffDay}d`;
}

interface NotificationDropdownProps {
  onMarkAllRead: () => void;
  onClose: () => void;
}

export function NotificationDropdown({ onMarkAllRead, onClose }: NotificationDropdownProps) {
  const t = useTranslations('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/notifications?pageSize=10');
        if (res.ok) {
          const json = await res.json();
          setNotifications(json.data?.notifications ?? []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'PATCH' }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    onMarkAllRead();
  };

  const handleClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    onClose();
  };

  const renderBody = (notification: Notification) => {
    // Extract the last segment of the bodyKey as the translation key path
    // e.g., "notifications.signatureRequested.body" → use t('signatureRequested.body', params)
    const key = notification.bodyKey.replace('notifications.', '');
    try {
      return t(key, notification.params ?? {});
    } catch {
      return notification.bodyKey;
    }
  };

  const renderTitle = (notification: Notification) => {
    const key = notification.titleKey.replace('notifications.', '');
    try {
      return t(key, notification.params ?? {});
    } catch {
      return notification.titleKey;
    }
  };

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="flex max-h-96 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{t('title')}</h3>
        {hasUnread && (
          <Button variant="ghost" size="xs" onClick={markAllRead}>
            {t('markAllRead')}
          </Button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
            {t('loading')}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-8 text-sm">
            <Bell className="h-8 w-8 opacity-30" />
            {t('empty')}
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = ICON_MAP[notification.type] ?? Bell;
            const content = (
              <div
                className={cn(
                  'hover:bg-accent flex items-start gap-3 border-b px-4 py-3 transition-colors',
                  !notification.read && 'bg-primary/5',
                )}
              >
                <div className="mt-0.5 shrink-0">
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      !notification.read ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('truncate text-sm', !notification.read && 'font-medium')}>
                      {renderTitle(notification)}
                    </p>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {renderBody(notification)}
                  </p>
                </div>
                {!notification.read && (
                  <div className="bg-primary mt-2 h-2 w-2 shrink-0 rounded-full" />
                )}
              </div>
            );

            if (notification.link) {
              return (
                <Link
                  key={notification.id}
                  href={notification.link as string & {}}
                  onClick={() => handleClick(notification)}
                  className="block"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={notification.id}
                onClick={() => handleClick(notification)}
                className="cursor-pointer"
              >
                {content}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-2">
        <Link
          href={'/notifications' as string & {}}
          onClick={onClose}
          className="text-primary block text-center text-xs font-medium hover:underline"
        >
          {t('viewAll')}
        </Link>
      </div>
    </div>
  );
}
