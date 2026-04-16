import { getLocale, getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock, FileText } from 'lucide-react';
import { SharedDocumentViewer } from '@/components/shared/shared-document-viewer';

export default async function SharedDocumentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const locale = await getLocale();
  const t = await getTranslations('shared');

  const share = await db.documentShare.findUnique({
    where: { token },
    include: {
      document: {
        include: {
          template: {
            select: {
              nameHe: true,
              nameAr: true,
              nameEn: true,
              nameRu: true,
            },
          },
        },
      },
    },
  });

  if (!share) {
    notFound();
  }

  const isExpired = new Date() > share.expiresAt;

  if (isExpired) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card>
          <CardContent className="text-muted-foreground flex flex-col items-center justify-center py-16">
            <AlertTriangle className="text-destructive mb-4 h-12 w-12" />
            <h1 className="text-foreground mb-2 text-xl font-bold">{t('expired')}</h1>
            <p>{t('expiredDescription')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const doc = share.document;
  const nameKey =
    `name${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof typeof doc.template;
  const templateName = (doc.template[nameKey] as string) || doc.template.nameEn;

  const statusStyles: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    PENDING_SIGNATURE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    SIGNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="text-primary h-8 w-8 shrink-0" />
          <div>
            <h1 className="text-2xl font-bold">{doc.title}</h1>
            <p className="text-muted-foreground text-sm">{templateName}</p>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-sm font-medium ${statusStyles[doc.status] || statusStyles.DRAFT}`}
        >
          {t(`status.${doc.status}` as 'status.DRAFT')}
        </span>
      </div>

      {/* Expiry notice */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
        <Clock className="h-4 w-4 shrink-0" />
        <span>{t('expiresAt', { date: formatDate(share.expiresAt) })}</span>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('metadata')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">{t('created')}</dt>
              <dd className="font-medium">{formatDate(doc.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('lastUpdated')}</dt>
              <dd className="font-medium">{formatDate(doc.updatedAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Rendered Contract */}
      {doc.renderedBody && (
        <SharedDocumentViewer
          token={share.token}
          renderedBody={doc.renderedBody}
          locale={doc.locale}
          permission={share.permission}
        />
      )}

      {/* Shared banner */}
      <p className="text-muted-foreground text-center text-xs">{t('sharedVia')}</p>
    </div>
  );
}
