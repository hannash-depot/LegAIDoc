import { db } from '@/lib/db';
import { auth } from '@/auth';
import { getLocale, getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { CheckoutForm } from '@/components/payments/checkout-form';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string }>;
}) {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations('checkout');
  const { planId } = await searchParams;

  if (!session?.user?.id) {
    redirect({ href: '/login', locale });
    return null;
  }

  const plans = await db.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  const serialized = plans.map((p) => ({
    id: p.id,
    slug: p.slug,
    nameHe: p.nameHe,
    nameAr: p.nameAr,
    nameEn: p.nameEn,
    nameRu: p.nameRu,
    priceIls: p.priceIls,
    features: p.features as string[],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('description')}</p>
      </div>
      <CheckoutForm plans={serialized} initialPlanId={planId} />
    </div>
  );
}
