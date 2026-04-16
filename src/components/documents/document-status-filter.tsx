'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';

const STATUSES = ['ALL', 'DRAFT', 'PENDING_SIGNATURE', 'PUBLISHED', 'SIGNED', 'ARCHIVED'] as const;
type StatusFilter = (typeof STATUSES)[number];

interface DocumentStatusFilterProps {
  active: StatusFilter;
  onChange: (status: StatusFilter) => void;
  counts: Record<string, number>;
}

export function DocumentStatusFilter({ active, onChange, counts }: DocumentStatusFilterProps) {
  const t = useTranslations('documents');

  return (
    <div
      className="bg-secondary/50 flex flex-wrap gap-1 rounded-lg p-1"
      role="tablist"
      aria-label={t('filterLabel')}
    >
      {STATUSES.map((status) => {
        const count =
          status === 'ALL' ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[status] || 0;
        return (
          <button
            key={status}
            role="tab"
            aria-selected={active === status}
            onClick={() => onChange(status)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              active === status
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {status === 'ALL' ? t('filterAll') : t(`status.${status}` as 'status.DRAFT')}
            <span className="bg-secondary rounded-full px-1.5 py-0.5 text-xs">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

export type { StatusFilter };
