'use client';

import { createElement, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ICON_OPTIONS, getIconByName } from '@/lib/icon-utils';
import { ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  value?: string | null;
  onChange: (iconName: string) => void;
}

function SelectedIcon({ name, className }: { name?: string | null; className?: string }) {
  const icon = name ? getIconByName(name) : null;
  if (!icon) return <ScrollText className={cn(className, 'opacity-50')} />;
  return createElement(icon, { className });
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const t = useTranslations('adminCategories');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return ICON_OPTIONS;
    const q = search.toLowerCase();
    return ICON_OPTIONS.filter(({ name }) => name.toLowerCase().includes(q));
  }, [search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-start gap-2 font-normal',
            !value && 'text-muted-foreground',
          )}
        >
          <SelectedIcon name={value} className="h-4 w-4 shrink-0" />
          <span className="truncate">{value || t('iconPlaceholder')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <Input
          placeholder={t('iconSearch')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
        />
        <div className="grid max-h-60 grid-cols-6 gap-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground col-span-6 py-4 text-center text-sm">
              {t('noIconsFound')}
            </p>
          ) : (
            filtered.map(({ name, component: Icon }) => (
              <button
                key={name}
                type="button"
                title={name}
                className={cn(
                  'hover:bg-accent flex h-9 w-full items-center justify-center rounded-md transition-colors',
                  value === name && 'bg-primary/10 text-primary ring-primary/30 ring-1',
                )}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                  setSearch('');
                }}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
