/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Link } from '@/i18n/navigation';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { CreditCard, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function ManageSubscription({ subscription }: { subscription: any }) {
  const t = useTranslations('billing');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    // This would call an API route like /api/payments/subscriptions/cancel
    // which would interface with the chosen PaymentProvider to cancel renewals
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsCancelling(false);
    // Toast and refresh would go here
  };

  if (!subscription || !subscription.plan) {
    return (
      <Button asChild variant="default" className="mt-4 w-full sm:w-auto">
        <Link href="/pricing">{t('viewPlans')}</Link>
      </Button>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      <Button asChild variant="outline" className="gap-2">
        <Link href="/pricing">
          <CreditCard className="h-4 w-4" />
          {t('changePlan')}
        </Link>
      </Button>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {t('cancelSubscription')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive h-5 w-5" />
              {t('cancelConfirmTitle')}
            </DialogTitle>
            <DialogDescription>{t('cancelConfirmDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() =>
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
              }
            >
              {t('keepSubscription')}
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isCancelling}>
              {isCancelling ? t('cancelling') : t('confirmCancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
