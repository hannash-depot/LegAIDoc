import { auth } from '@/auth';
import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { NotificationList } from '@/components/notifications/notification-list';

export default async function NotificationsPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user?.id) {
    redirect({ href: '/login', locale });
    return null;
  }

  return (
    <main className="container py-8">
      <NotificationList />
    </main>
  );
}
