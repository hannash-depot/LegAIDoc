import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, CreditCard, Activity } from 'lucide-react';

async function getDashboardMetrics() {
  const [totalUsers, totalDocuments, activeSubscriptions, recentPayments] = await Promise.all([
    db.user.count(),
    db.document.count({ where: { status: { not: 'DRAFT' } } }),
    db.subscription.count({ where: { status: 'ACTIVE' } }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETED' },
    }),
  ]);

  const totalRevenue = (recentPayments._sum.amount || 0) / 100; // Assuming stored in agorot

  return { totalUsers, totalDocuments, activeSubscriptions, totalRevenue };
}

export default async function AdminDashboardPage() {
  const t = await getTranslations('admin');
  const metrics = await getDashboardMetrics();

  const statCards = [
    {
      title: t('users'),
      value: metrics.totalUsers.toLocaleString(),
      icon: Users,
      description: t('totalRegisteredUsers'),
    },
    {
      title: t('documents'),
      value: metrics.totalDocuments.toLocaleString(),
      icon: FileText,
      description: t('nonDraftDocuments'),
    },
    {
      title: t('activeSubscriptions'),
      value: metrics.activeSubscriptions.toLocaleString(),
      icon: Activity,
      description: t('payingUsers'),
    },
    {
      title: t('totalRevenue'),
      value: `₪${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: CreditCard,
      description: t('completedPayments'),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard')}</h1>
        <p className="text-muted-foreground mt-2">{t('dashboardDescription')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-muted-foreground text-xs">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm">{t('activityComingSoon')}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
