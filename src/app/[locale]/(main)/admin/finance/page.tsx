import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api/require-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FinanceList } from './_components/finance-list';

export default async function AdminFinancePage() {
  await requireAdmin();
  const t = await getTranslations('admin');

  const [payments, totalCount] = await Promise.all([
    db.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, name: true, email: true } },
        subscription: {
          select: { id: true, plan: { select: { nameEn: true } } },
        },
      },
    }),
    db.payment.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('finance')}</h1>
        <p className="text-muted-foreground mt-2">{t('financeDescription')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('recentPayments')}</CardTitle>
        </CardHeader>
        <CardContent>
          <FinanceList initialPayments={payments} totalCount={totalCount} />
        </CardContent>
      </Card>
    </div>
  );
}
