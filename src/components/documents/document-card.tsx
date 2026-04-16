'use client';

import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Pen, Trash2, Copy, Share2, Check } from 'lucide-react';
import { useState } from 'react';

interface DocumentData {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  template: {
    nameHe: string;
    nameAr: string;
    nameEn: string;
    nameRu: string;
  };
}

interface DocumentCardProps {
  document: DocumentData;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function DocumentCard({ document: doc, onDelete, onDuplicate }: DocumentCardProps) {
  const t = useTranslations('documents');
  const locale = useLocale();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const format = useFormatter();

  const nameKey =
    `name${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof typeof doc.template;
  const templateName = doc.template[nameKey] || doc.template.nameEn;

  const statusStyles: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    PENDING_SIGNATURE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    SIGNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };

  const formatDate = (dateStr: string) => {
    return format.dateTime(new Date(dateStr), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = async () => {
    if (!confirm(t('deleteConfirm'))) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete?.(doc.id);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/share`, { method: 'POST' });
      if (res.ok) {
        const { data } = await res.json();
        const shareUrl = `${window.location.origin}/${locale}/shared/${data.token}`;
        await navigator.clipboard.writeText(shareUrl);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        onDuplicate?.(doc.id);
        router.refresh();
      }
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <Link
          href={`/documents/${doc.id}` as '/documents'}
          className="group min-w-0 flex-1 outline-none"
        >
          <CardTitle className="group-hover:text-primary text-base transition-colors">
            {doc.title}
          </CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">{templateName}</p>
          <p className="text-muted-foreground text-xs">{formatDate(doc.createdAt)}</p>
        </Link>
        <div className="ml-4 flex shrink-0 flex-col items-end rtl:mr-4 rtl:ml-0">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[doc.status] || statusStyles.DRAFT}`}
          >
            {t(`status.${doc.status}` as 'status.DRAFT')}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          {' '}
          <a href={`/api/documents/${doc.id}/pdf`} download>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{t('downloadPdf')}</span>
            </Button>
          </a>
          {doc.status === 'DRAFT' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/documents/${doc.id}` as '/templates')}
            >
              <Pen className="h-4 w-4" />
              <span className="hidden sm:inline">{t('sign')}</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={isDuplicating}>
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">{t('duplicate')}</span>
          </Button>
          {doc.status !== 'ARCHIVED' && (
            <Button variant="outline" size="sm" onClick={handleShare} disabled={isSharing}>
              {shareSuccess ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {shareSuccess ? t('shareCopied') : t('share')}
              </span>
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting || doc.status === 'SIGNED'}
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">
              {doc.status === 'DRAFT' ? t('deleteAction') : t('archiveAction')}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
