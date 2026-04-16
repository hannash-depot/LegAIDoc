import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CategoryList } from './_components/category-list';
import dynamic from 'next/dynamic';

const CategoryFormDialog = dynamic(() =>
  import('./_components/category-form-dialog').then((m) => m.CategoryFormDialog),
);

export default async function AdminCategoriesPage() {
  const t = await getTranslations('admin');

  // Fetch categories directly from DB since this is a Server Component
  const categories = await db.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { templates: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('categories')}</h1>
          <p className="text-muted-foreground mt-2">{t('categoriesDescription')}</p>
        </div>
        <CategoryFormDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('createCategory')}
            </Button>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('allCategories')}</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryList initialCategories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
