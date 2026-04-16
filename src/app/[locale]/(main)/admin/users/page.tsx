import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserList } from './_components/user-list';

export default async function AdminUsersPage() {
  const t = await getTranslations('admin');

  // Fetch initial users from DB for SSR
  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50, // Initial limit for the table
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { documents: true, subscriptions: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('users')}</h1>
        <p className="text-muted-foreground mt-2">{t('usersDescription')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('allUsers')}</CardTitle>
        </CardHeader>
        <CardContent>
          <UserList initialUsers={users} />
        </CardContent>
      </Card>
    </div>
  );
}
