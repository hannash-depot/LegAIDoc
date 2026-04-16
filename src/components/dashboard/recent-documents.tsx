'use client';

import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Download, FileText, Plus } from 'lucide-react';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';
import { motion } from 'framer-motion';

interface RecentDocument {
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

interface RecentDocumentsProps {
  documents: RecentDocument[];
}

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  PENDING_SIGNATURE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  SIGNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export function RecentDocuments({ documents }: RecentDocumentsProps) {
  const t = useTranslations('dashboard');
  const td = useTranslations('documents');
  const locale = useLocale();

  const format = useFormatter();

  const getTemplateName = (template: RecentDocument['template']) => {
    const key = `name${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof typeof template;
    return (template[key] as string) || template.nameEn;
  };

  const formatDate = (dateStr: string) =>
    format.dateTime(new Date(dateStr), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <Card className="glass-card overflow-hidden border-white/20 shadow-xl dark:border-white/10">
      <CardHeader className="border-border/50 bg-muted/20 flex flex-row items-center justify-between space-y-0 border-b pb-4">
        <CardTitle className="font-serif text-xl font-bold">{t('recentDocuments')}</CardTitle>
        <Link href="/documents">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-primary/10 transition-colors"
          >
            {t('viewAll')}
            <ArrowRight className="ms-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-6">
        {documents.length === 0 ? (
          <PremiumEmptyState
            icon={<FileText className="h-6 w-6" />}
            title={t('noDocuments')}
            description={t('getStarted')}
            action={
              <Link href="/templates">
                <Button
                  variant="default"
                  size="sm"
                  className="shadow-primary/20 shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('newContract')}
                </Button>
              </Link>
            }
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {documents.map((doc) => (
              <motion.div key={doc.id} variants={itemVariants}>
                <div className="group hover:border-border/50 bg-background/40 hover:bg-background/80 relative flex cursor-default items-center justify-between overflow-hidden rounded-xl border border-transparent p-3 transition-all hover:shadow-md">
                  <div className="bg-primary/0 group-hover:bg-primary/80 absolute inset-y-0 left-0 w-1 transition-colors" />
                  <Link
                    href={`/documents/${doc.id}` as '/documents'}
                    className="min-w-0 flex-1 pl-2 outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-foreground/90 group-hover:text-primary truncate text-sm font-semibold transition-colors">
                        {doc.title}
                      </p>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${statusStyles[doc.status] || statusStyles.DRAFT}`}
                      >
                        {td(`status.${doc.status}` as 'status.DRAFT')}
                      </span>
                    </div>
                    <p className="text-muted-foreground/80 mt-1 text-xs font-medium">
                      {getTemplateName(doc.template)} · {formatDate(doc.createdAt)}
                    </p>
                  </Link>
                  <div className="flex shrink-0 -translate-x-2 items-center gap-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                    <a href={`/api/documents/${doc.id}/pdf`} download>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="hover:bg-primary hover:text-primary-foreground h-8 w-8 shadow-sm transition-colors"
                        title={t('downloadPdf')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
