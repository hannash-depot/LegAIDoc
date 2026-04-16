import { db } from '@/lib/db';
import { auth } from '@/auth';
import { getLocale, getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import dynamic from 'next/dynamic';

const RequestSignaturesDialog = dynamic(() =>
  import('@/components/signature/request-signatures-dialog').then((m) => m.RequestSignaturesDialog),
);
import { SigningLinksPanel } from '@/components/signature/signing-links-panel';
import { DocumentDownloadButton } from '@/components/documents/document-download-button';
import { DocumentShareButton } from '@/components/documents/document-share-button';
import { DocumentPreview } from '@/components/documents/document-preview';
import { ContractBodyExplainer } from '@/components/documents/contract-body-explainer';
import { DocumentCommentsSidebar } from '@/components/documents/document-comments-sidebar';
import { FEATURE_ESIG, FEATURE_PAYMENTS } from '@/lib/feature-flags';
import { isDocumentPaid } from '@/lib/payments/check-payment';
import { truncateHtml } from '@/lib/html-truncate';

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale: paramLocale } = await params;
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations('documents');
  const ts = await getTranslations('signing');

  if (!session?.user?.id) {
    redirect({ href: '/login', locale: paramLocale });
    return null;
  }

  const document = await db.document.findUnique({
    where: { id },
    include: {
      template: {
        select: { nameHe: true, nameAr: true, nameEn: true, nameRu: true },
      },
      signatories: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          verifiedAt: true,
          signedAt: true,
        },
      },
    },
  });

  if (!document || document.userId !== session.user.id) {
    redirect({ href: '/documents', locale: paramLocale });
    return null;
  }

  const nameKey =
    `name${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof typeof document.template;
  const templateName = (document.template[nameKey] as string) || document.template.nameEn;

  // Check if document has been paid for (or is free)
  const isPaid = await isDocumentPaid(document.id, session.user.id, document.status);
  const needsPayment = FEATURE_PAYMENTS && !isPaid;

  const statusStyles: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    PENDING_SIGNATURE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    SIGNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '—';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  // Serialize signatories for client components
  const serializedSignatories = document.signatories.map((s) => ({
    ...s,
    verifiedAt: s.verifiedAt ? s.verifiedAt.toISOString() : null,
    signedAt: s.signedAt ? s.signedAt.toISOString() : null,
  }));

  const pendingCount = document.signatories.filter((s) => !s.signedAt).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={'/documents' as '/templates'}>
          <Button variant="ghost" size="icon" aria-label={t('backToList')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{document.title}</h1>
          <p className="text-muted-foreground text-sm">{templateName}</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusStyles[document.status] || statusStyles.DRAFT}`}
        >
          {t(`status.${document.status}` as 'status.DRAFT')}
        </span>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('detailMetadata')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">{t('detailCreated')}</dt>
              <dd className="font-medium">{formatDate(document.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('detailUpdated')}</dt>
              <dd className="font-medium">{formatDate(document.updatedAt)}</dd>
            </div>
            {document.publishedAt && (
              <div>
                <dt className="text-muted-foreground">{t('detailPublished')}</dt>
                <dd className="font-medium">{formatDate(document.publishedAt)}</dd>
              </div>
            )}
            {document.signedAt && (
              <div>
                <dt className="text-muted-foreground">{t('detailSigned')}</dt>
                <dd className="font-medium">{formatDate(document.signedAt)}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Signing Links Panel — shown when ESIG enabled and document has signatories */}
      {FEATURE_ESIG &&
        document.signatories.length > 0 &&
        (document.status === 'PENDING_SIGNATURE' || document.status === 'SIGNED') && (
          <SigningLinksPanel documentId={document.id} signatories={serializedSignatories} />
        )}

      {/* Signatories list (legacy display for when there's no signing links panel) */}
      {document.signatories.length > 0 &&
        document.status !== 'PENDING_SIGNATURE' &&
        document.status !== 'SIGNED' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('detailSignatories')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {document.signatories.map((sig) => (
                  <div
                    key={sig.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{sig.name}</p>
                      <p className="text-muted-foreground text-sm">{sig.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">{sig.role}</span>
                      {sig.signedAt ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {t('statusSigned')}
                        </span>
                      ) : sig.verifiedAt ? (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {t('statusVerified')}
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          {t('statusPending')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Rendered Contract & Comments */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {document.renderedBody && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('detailContract')}</CardTitle>
              </CardHeader>
              <CardContent>
                {needsPayment ? (
                  <DocumentPreview
                    truncatedHtml={truncateHtml(document.renderedBody, 25)}
                    documentId={document.id}
                  />
                ) : (
                  <ContractBodyExplainer html={document.renderedBody} locale={locale} />
                )}
              </CardContent>
            </Card>
          )}
        </div>
        <div>
          <DocumentCommentsSidebar documentId={document.id} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <DocumentDownloadButton documentId={document.id} status={document.status} isPaid={isPaid} />

        <DocumentShareButton documentId={document.id} status={document.status} />

        {/* Edit Contract — only for DRAFT documents */}
        {document.status === 'DRAFT' && (
          <Link href={`/wizard/${document.templateId}?edit=${document.id}` as string & {}}>
            <Button variant="outline">
              <Pencil className="h-4 w-4" />
              {t('editContract')}
            </Button>
          </Link>
        )}

        {/* Request Signatures — only for DRAFT documents when ESIG enabled */}
        {FEATURE_ESIG && document.status === 'DRAFT' && (
          <RequestSignaturesDialog documentId={document.id} />
        )}

        {/* Pending signature count indicator */}
        {FEATURE_ESIG && document.status === 'PENDING_SIGNATURE' && pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
            {ts('pendingSignatures', { count: pendingCount })}
          </span>
        )}
      </div>
    </div>
  );
}
