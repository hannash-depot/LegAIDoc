/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download } from 'lucide-react';

export function PaymentHistory({ payments, locale }: { payments: any[]; locale: string }) {
  const t = useTranslations('billing');

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return t('statusPending');
      case 'COMPLETED':
        return t('statusCompleted');
      case 'FAILED':
        return t('statusFailed');
      case 'REFUNDED':
        return t('statusRefunded');
      case 'PENDING_CLEARANCE':
        return t('statusClearance');
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'PENDING':
      case 'PENDING_CLEARANCE':
        return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400';
      case 'FAILED':
        return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400';
      case 'REFUNDED':
        return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/20 dark:text-slate-400';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/20 dark:text-slate-400';
    }
  };

  return (
    <Card className="glass border-primary/10 bg-background/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle>{t('paymentHistory')}</CardTitle>
        <CardDescription>{t('paymentHistoryDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted/50 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <svg
                className="text-muted-foreground/50 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-muted-foreground font-medium">{t('noPayments')}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                  <TableHead className="w-[120px] font-semibold">{t('date')}</TableHead>
                  <TableHead className="font-semibold">{t('amount')}</TableHead>
                  <TableHead className="font-semibold">{t('status')}</TableHead>
                  <TableHead className="text-end font-semibold">{t('invoice')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const date = new Date(payment.createdAt).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });
                  const amount = new Intl.NumberFormat(locale, {
                    style: 'currency',
                    currency: payment.currency,
                  }).format(payment.amount / 100);
                  const invoice = payment.invoices?.[0];

                  return (
                    <TableRow key={payment.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="text-muted-foreground">{date}</TableCell>
                      <TableCell className="font-medium">{amount}</TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(payment.status)}`}
                        >
                          {getStatusText(payment.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-end">
                        {invoice ? (
                          <a
                            href={`/api/payments/invoices/${invoice.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{t('download')}</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground/50 text-sm italic">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
