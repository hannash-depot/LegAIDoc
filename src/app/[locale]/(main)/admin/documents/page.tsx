import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api/require-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentList } from './_components/document-list';

export default async function AdminDocumentsPage() {
  await requireAdmin();
  const t = await getTranslations('admin');

  const [documents, categories] = await Promise.all([
    db.document.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, name: true, email: true } },
        template: {
          select: {
            id: true,
            slug: true,
            nameEn: true,
            isActive: true,
            category: { select: { id: true, nameEn: true, nameHe: true } },
          },
        },
        _count: { select: { signatories: true } },
      },
    }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, nameEn: true, nameHe: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('documents')}</h1>
        <p className="text-muted-foreground mt-2">{t('documentsDescription')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('allDocuments')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentList initialDocuments={documents} categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
