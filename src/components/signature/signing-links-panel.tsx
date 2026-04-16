'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link2, Copy, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface SignatoryInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  verifiedAt: string | Date | null;
  signedAt: string | Date | null;
}

interface SigningLinksPanelProps {
  documentId: string;
  signatories: SignatoryInfo[];
}

export function SigningLinksPanel({ documentId, signatories }: SigningLinksPanelProps) {
  const t = useTranslations('signing');
  const locale = useLocale();

  const copyLink = async (signatoryId: string) => {
    const url = `${window.location.origin}/${locale}/sign/${documentId}/${signatoryId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('linkCopied'));
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success(t('linkCopied'));
    }
  };

  const getStatus = (sig: SignatoryInfo) => {
    if (sig.signedAt) return 'signed';
    if (sig.verifiedAt) return 'verified';
    return 'pending';
  };

  const statusConfig = {
    signed: {
      icon: CheckCircle2,
      label: t('signed'),
      style: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    verified: {
      icon: ShieldCheck,
      label: t('verified'),
      style: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    pending: {
      icon: Clock,
      label: t('pending'),
      style: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
  };

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="text-primary h-4 w-4" />
          {t('signingLinks')}
        </CardTitle>
        <CardDescription>{t('signingLinksDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {signatories.map((sig) => {
            const status = getStatus(sig);
            const config = statusConfig[status];
            const StatusIcon = config.icon;

            return (
              <div
                key={sig.id}
                className="border-border/50 bg-background/50 hover:bg-accent/30 flex items-center justify-between rounded-lg border p-3 transition-colors"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <StatusIcon className={`h-5 w-5 shrink-0 ${config.iconColor}`} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{sig.name}</p>
                    <p className="text-muted-foreground truncate text-xs">{sig.email}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${config.style}`}
                  >
                    {config.label}
                  </span>
                  {!sig.signedAt && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyLink(sig.id)}
                      title={t('copyLink')}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
