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
import { formatDistanceToNow } from 'date-fns';

type UserListItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  _count: {
    documents: number;
    subscriptions: number;
  };
};

export function UserList({ initialUsers }: { initialUsers: UserListItem[] }) {
  const [users] = useState<UserListItem[]>(initialUsers);
  const t = useTranslations('adminUsers');

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('name')}</TableHead>
            <TableHead>{t('email')}</TableHead>
            <TableHead>{t('role')}</TableHead>
            <TableHead>{t('status')}</TableHead>
            <TableHead>{t('docs')}</TableHead>
            <TableHead>{t('subs')}</TableHead>
            <TableHead className="text-right">{t('joined')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                {t('noUsers')}
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs">
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={
                      user.isActive
                        ? 'bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs'
                        : 'rounded-full border px-2 py-1 text-xs'
                    }
                  >
                    {user.isActive ? t('active') : t('inactive')}
                  </span>
                </TableCell>
                <TableCell>{user._count.documents}</TableCell>
                <TableCell>{user._count.subscriptions}</TableCell>
                <TableCell className="text-right">
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
