import { getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { Check } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatIls } from '@/lib/payments/payment-service';
import { PricingButton } from '@/components/pricing/pricing-button';

// Plans rarely change — revalidate every hour instead of on every request
export const revalidate = 3600;

export default async function PricingPage() {
  const locale = await getLocale();
  const t = await getTranslations('pricing');

  const plans = await db.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  const capitalizedLocale = locale.charAt(0).toUpperCase() + locale.slice(1);

  return (
    <div className="container py-24 sm:py-32">
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <h1 className="from-primary to-primary/60 mb-4 bg-gradient-to-r bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
          {t('title')}
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">{t('description')}</p>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
        {plans.map((plan) => {
          const planName =
            ((plan as Record<string, unknown>)[`name${capitalizedLocale}`] as string) ||
            plan.nameEn;
          const features = Array.isArray(plan.features) ? plan.features : [];
          const isPopular = plan.slug === 'professional';

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg ${
                isPopular ? 'border-primary ring-primary shadow-md ring-1' : 'border-border/50'
              }`}
            >
              {isPopular && (
                <div className="bg-primary text-primary-foreground absolute top-0 right-0 rounded-bl-lg px-4 py-1 text-xs font-semibold">
                  {t('popular')}
                </div>
              )}
              <CardHeader className="relative pt-8 pb-8 text-center">
                <CardTitle className="mb-2 text-2xl">{planName}</CardTitle>
                <div className="mt-4 flex items-baseline justify-center gap-x-2">
                  <span className="text-foreground text-4xl font-bold tracking-tight">
                    {formatIls(plan.priceIls)}
                  </span>
                  <span className="text-muted-foreground text-sm leading-6 font-semibold">
                    {t('perMonth')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="text-muted-foreground space-y-4 text-sm">
                  {features.map((feature: unknown, i: number) => (
                    <li key={i} className="flex items-start gap-x-3">
                      <Check className="text-primary h-5 w-5 flex-none" aria-hidden="true" />
                      <span>{String(feature)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-8">
                <PricingButton planId={plan.id} priceIls={plan.priceIls} isPopular={isPopular} />
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
