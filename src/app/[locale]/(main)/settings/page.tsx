import { db } from '@/lib/db';
import { auth } from '@/auth';
import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import dynamic from 'next/dynamic';

const SettingsForm = dynamic(
  () => import('./_components/settings-form').then((m) => m.SettingsForm),
  {
    loading: () => <div className="bg-muted h-96 animate-pulse rounded-lg" />,
  },
);

export default async function SettingsPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user?.id) {
    redirect({ href: '/login', locale });
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      role: true,
      preferredLocale: true,
      notificationPrefs: true,
      hashedPassword: true,
      companyName: true,
      idNumber: true,
      address: true,
      phone: true,
      mfaEnabled: true,
    },
  });

  if (!user) {
    redirect({ href: '/login', locale });
    return null;
  }

  // Parse notification prefs from JSON
  const notificationPrefs = (user.notificationPrefs as {
    emailNotifications?: boolean;
    inAppNotifications?: boolean;
  }) ?? {
    emailNotifications: true,
    inAppNotifications: true,
  };

  return (
    <div className="space-y-8">
      <SettingsForm
        name={user.name}
        email={user.email}
        preferredLocale={user.preferredLocale}
        emailNotifications={notificationPrefs.emailNotifications ?? true}
        inAppNotifications={notificationPrefs.inAppNotifications ?? true}
        hasPassword={!!user.hashedPassword}
        companyName={user.companyName}
        idNumber={user.idNumber}
        address={user.address}
        phone={user.phone}
        isAdmin={user.role === 'ADMIN'}
        mfaEnabled={user.mfaEnabled}
      />
    </div>
  );
}
