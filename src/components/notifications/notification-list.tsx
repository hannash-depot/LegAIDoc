'use client';

import { useEffect, useState, useCallback } from 'react';
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
  ChevronLeft,
  ChevronRight,
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

interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NotificationList() {
  const t = useTranslations('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (filter === 'unread') params.set('read', 'false');
      const res = await fetch(`/api/notifications?${params}`);
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data?.notifications ?? []);
        setPagination(json.data?.pagination ?? null);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'PATCH' }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const renderBody = (notification: Notification) => {
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
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        {hasUnread && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            {t('markAllRead')}
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            setFilter('all');
            setPage(1);
          }}
        >
          {t('filterAll')}
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            setFilter('unread');
            setPage(1);
          }}
        >
          {t('filterUnread')}
        </Button>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-lg border">
        {loading ? (
          <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
            {t('loading')}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-12 text-sm">
            <Bell className="h-10 w-10 opacity-30" />
            {t('empty')}
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = ICON_MAP[notification.type] ?? Bell;
            const content = (
              <div
                className={cn(
                  'hover:bg-accent flex items-start gap-4 border-b px-5 py-4 transition-colors',
                  !notification.read && 'bg-primary/5',
                )}
              >
                <div className="mt-0.5 shrink-0">
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      !notification.read ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('text-sm', !notification.read && 'font-medium')}>
                      {renderTitle(notification)}
                    </p>
                    {!notification.read && (
                      <div className="bg-primary h-2 w-2 shrink-0 rounded-full" />
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">{renderBody(notification)}</p>
                  <p className="text-muted-foreground/70 mt-1 text-xs">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
              </div>
            );

            if (notification.link) {
              return (
                <Link
                  key={notification.id}
                  href={notification.link as string & {}}
                  onClick={() => {
                    if (!notification.read) markAsRead(notification.id);
                  }}
                  className="block"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={notification.id}
                onClick={() => {
                  if (!notification.read) markAsRead(notification.id);
                }}
                className="cursor-pointer"
              >
                {content}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-muted-foreground text-sm">
            {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
