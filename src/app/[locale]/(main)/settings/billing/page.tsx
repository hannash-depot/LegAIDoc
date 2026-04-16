import { db } from '@/lib/db';
import { auth } from '@/auth';
import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { SubscriptionSummary } from './_components/subscription-summary';
import { PaymentHistory } from './_components/payment-history';

export default async function BillingPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user?.id) {
    redirect({ href: '/login', locale });
    return null;
  }

  const subscription = await db.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVE',
    },
    include: {
      plan: true,
    },
  });

  const payments = await db.payment.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      invoices: true,
    },
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-8 duration-500">
      <SubscriptionSummary subscription={subscription} locale={locale} />
      <PaymentHistory payments={payments} locale={locale} />
    </div>
  );
}
