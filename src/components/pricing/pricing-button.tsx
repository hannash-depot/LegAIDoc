'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

interface PricingButtonProps {
  planId: string;
  priceIls: number;
  isPopular: boolean;
}

export function PricingButton({ planId, priceIls, isPopular }: PricingButtonProps) {
  const t = useTranslations('pricing');

  const isFree = priceIls === 0;
  const href = isFree ? '/register' : (`/checkout?planId=${planId}` as '/templates');

  return (
    <Link href={href} className="w-full">
      <Button className="w-full" variant={isPopular ? 'default' : 'outline'}>
        {isFree ? t('startFree') : t('choosePlan')}
      </Button>
    </Link>
  );
}
