import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TemplateList } from './_components/template-list';
import dynamic from 'next/dynamic';

const TemplateFormDialog = dynamic(() =>
  import('./_components/template-form-dialog').then((m) => m.TemplateFormDialog),
);
import Link from 'next/link';

export default async function AdminTemplatesPage() {
  const t = await getTranslations('admin');

  const [templates, categories] = await Promise.all([
    db.template.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, nameEn: true, nameHe: true } },
        _count: { select: { documents: true } },
      },
    }),
    db.category.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, nameEn: true, nameHe: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('templates')}</h1>
          <p className="text-muted-foreground mt-2">{t('templatesDescription')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/ai-import">{t('aiImport')}</Link>
          </Button>
          <TemplateFormDialog
            categories={categories}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('createTemplate')}
              </Button>
            }
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('allTemplates')}</CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateList initialTemplates={templates} />
        </CardContent>
      </Card>
    </div>
  );
}
