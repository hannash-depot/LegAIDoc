'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getIconByName } from '@/lib/icon-utils';
import { ScrollText } from 'lucide-react';

type CategoryWithCount = {
  id: string;
  slug: string;
  nameEn: string;
  nameHe: string;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { templates: number };
};

export function CategoryList({ initialCategories }: { initialCategories: CategoryWithCount[] }) {
  const t = useTranslations('adminCategories');
  // For a real app, you might use React Query or SWR to manage this state better.
  // Given the initial SSR categories, we just map them for now.
  const [categories] = useState<CategoryWithCount[]>(initialCategories);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('icon')}</TableHead>
            <TableHead>{t('slug')}</TableHead>
            <TableHead>{t('englishName')}</TableHead>
            <TableHead>{t('hebrewName')}</TableHead>
            <TableHead>{t('templates')}</TableHead>
            <TableHead>{t('status')}</TableHead>
            <TableHead>{t('order')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                {t('noCategories')}
              </TableCell>
            </TableRow>
          ) : (
            categories.map((cat) => {
              const Icon = cat.icon ? getIconByName(cat.icon) : null;
              return (
                <TableRow key={cat.id}>
                  <TableCell>
                    {Icon ? (
                      <Icon className="h-4 w-4" />
                    ) : (
                      <ScrollText className="text-muted-foreground h-4 w-4" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{cat.slug}</TableCell>
                  <TableCell>{cat.nameEn}</TableCell>
                  <TableCell>{cat.nameHe}</TableCell>
                  <TableCell>{cat._count.templates}</TableCell>
                  <TableCell>
                    <Badge variant={cat.isActive ? 'default' : 'secondary'}>
                      {cat.isActive ? t('active') : t('inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>{cat.sortOrder}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
