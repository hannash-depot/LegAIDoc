'use client';

import { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { NotificationDropdown } from './notification-dropdown';

const POLL_INTERVAL = 30_000;

async function fetchUnreadCount(): Promise<number> {
  try {
    const res = await fetch('/api/notifications/unread-count');
    if (res.ok) {
      const json = await res.json();
      return json.data?.count ?? 0;
    }
  } catch {
    // Silently fail
  }
  return -1; // -1 = no change
}

export function NotificationBell() {
  const t = useTranslations('notifications');
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      const count = await fetchUnreadCount();
      if (!cancelled && count >= 0) setUnreadCount(count);
    };

    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      // Refresh count when closing the dropdown
      fetchUnreadCount().then((c) => {
        if (c >= 0) setUnreadCount(c);
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t('bellLabel')}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="bg-destructive absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <NotificationDropdown
          onMarkAllRead={() => setUnreadCount(0)}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
