import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api/require-admin';
import dynamic from 'next/dynamic';

const TemplateEditor = dynamic(
  () => import('./_components/template-editor').then((m) => m.TemplateEditor),
  {
    loading: () => <div className="bg-muted h-[600px] animate-pulse rounded-lg" />,
  },
);

type Params = { params: Promise<{ id: string }> };

export default async function TemplateEditorPage({ params }: Params) {
  await requireAdmin();
  const { id } = await params;

  const [template, categories] = await Promise.all([
    db.template.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, nameEn: true, nameHe: true } },
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, version: true, changeNote: true, createdAt: true },
        },
      },
    }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, nameEn: true, nameHe: true, nameAr: true, nameRu: true },
    }),
  ]);

  if (!template) notFound();

  return <TemplateEditor template={JSON.parse(JSON.stringify(template))} categories={categories} />;
}
