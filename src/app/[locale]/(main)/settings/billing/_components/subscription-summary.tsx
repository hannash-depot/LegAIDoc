/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { ManageSubscription } from './manage-subscription';

export function SubscriptionSummary({
  subscription,
  locale,
}: {
  subscription: any;
  locale: string;
}) {
  const t = useTranslations('billing');

  if (!subscription || !subscription.plan) {
    return (
      <Card className="glass border-primary/20 bg-background/50 backdrop-blur-xl transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle>{t('currentPlan')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('noActivePlan')}</p>
          <ManageSubscription subscription={subscription} />
        </CardContent>
      </Card>
    );
  }

  const { plan, endDate } = subscription;
  const capitalizedLocale = locale.charAt(0).toUpperCase() + locale.slice(1);
  const planName = plan[`name${capitalizedLocale}`] || plan.nameEn;
  const dateFormatted = endDate ? new Date(endDate).toLocaleDateString(locale) : '—';

  return (
    <Card className="glass border-primary/20 bg-background/50 relative overflow-hidden backdrop-blur-xl transition-all duration-300 hover:shadow-md">
      <div className="bg-primary/20 pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full blur-3xl" />
      <CardHeader className="relative z-10">
        <CardTitle>{t('currentPlan')}</CardTitle>
        <CardDescription>{t('planActiveUntil', { date: dateFormatted })}</CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="from-foreground to-foreground/70 bg-gradient-to-br bg-clip-text text-2xl font-bold text-transparent">
              {planName}
            </h3>
            <p className="text-muted-foreground mt-1 text-sm font-medium">
              <span className="text-foreground">{plan.priceIls / 100} ILS</span> / month
            </p>
          </div>
          <ManageSubscription subscription={subscription} />
        </div>
      </CardContent>
    </Card>
  );
}
