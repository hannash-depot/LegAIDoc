import { db } from '@/lib/db';
import { auth } from '@/auth';
import { getLocale, getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { RecentDocuments } from '@/components/dashboard/recent-documents';
import { Plus } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations('dashboard');

  if (!session?.user?.id) {
    redirect({ href: '/login', locale });
    return null;
  }

  // Fetch document status counts
  const statusCounts = await db.document.groupBy({
    by: ['status'],
    where: { userId: session.user.id },
    _count: { status: true },
  });

  const countMap: Record<string, number> = {};
  for (const row of statusCounts) {
    countMap[row.status] = row._count.status;
  }

  const total = Object.values(countMap).reduce((sum, c) => sum + c, 0);
  const drafts = countMap['DRAFT'] || 0;
  const pendingSignature = countMap['PENDING_SIGNATURE'] || 0;
  const signed = countMap['SIGNED'] || 0;

  // Fetch recent documents
  const recentDocs = await db.document.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      template: { select: { nameHe: true, nameAr: true, nameEn: true, nameRu: true } },
    },
  });

  const serializedDocs = recentDocs.map((d) => ({
    id: d.id,
    title: d.title,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
    template: d.template,
  }));

  const userName = session.user.name || '';

  return (
    <div className="space-y-8">
      {/* Header: Welcome Banner */}
      <div className="glass-card group relative overflow-hidden rounded-3xl border-white/20 p-8 shadow-xl dark:border-white/10">
        <div className="from-primary/10 via-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-50 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="bg-primary/20 pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-foreground/90 font-serif text-4xl font-bold tracking-tight">
              {t('welcome', { name: userName })}
            </h1>
            <p className="text-muted-foreground/80 text-lg font-medium">{t('title')}</p>
          </div>
          <Link href="/templates">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25 hover:shadow-primary/40 shadow-lg transition-all hover:-translate-y-0.5"
            >
              <Plus className="mr-2 h-5 w-5" />
              {t('newContract')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <DashboardStats
        total={total}
        drafts={drafts}
        pendingSignature={pendingSignature}
        signed={signed}
      />

      {/* Recent Documents */}
      <RecentDocuments documents={serializedDocs} />
    </div>
  );
}
