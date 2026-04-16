import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import dynamic from 'next/dynamic';

const AiImportForm = dynamic(
  () => import('@/components/admin/ai-import-form').then((m) => m.AiImportForm),
  {
    loading: () => <div className="bg-muted h-96 animate-pulse rounded-lg" />,
  },
);

export default async function AiImportPage() {
  const t = await getTranslations('aiImport');

  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, nameEn: true, nameHe: true, nameAr: true, nameRu: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('description')}</p>
      </div>
      <AiImportForm categories={categories} />
    </div>
  );
}
