import { db } from '@/lib/db';
import { auth } from '@/auth';
import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { DocumentList } from '@/components/documents/document-list';

export default async function DocumentsPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user?.id) {
    redirect({ href: '/login', locale });
    return null;
  }

  const documents = await db.document.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      template: { select: { nameHe: true, nameAr: true, nameEn: true, nameRu: true } },
    },
  });

  // Serialize dates for client component
  const serialized = documents.map((d) => ({
    id: d.id,
    title: d.title,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
    template: d.template,
  }));

  return <DocumentList documents={serialized} />;
}
