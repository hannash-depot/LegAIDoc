'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Download, RefreshCw, Loader2 } from 'lucide-react';

type PaymentListItem = {
  id: string;
  amount: number;
  vatAmount: number;
  currency: string;
  status: string;
  gatewayRef: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  subscription: {
    id: string;
    plan: {
      nameEn: string;
    };
  } | null;
};

const PAYMENT_STATUSES = [
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
  'PENDING_CLEARANCE',
] as const;

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  REFUNDED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  PENDING_CLEARANCE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

interface FinanceListProps {
  initialPayments: PaymentListItem[];
  totalCount: number;
}

export function FinanceList({ initialPayments, totalCount }: FinanceListProps) {
  const t = useTranslations('adminFinance');
  const [payments, setPayments] = useState<PaymentListItem[]>(initialPayments);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [cursor, setCursor] = useState<string | null>(
    initialPayments.length > 0 ? initialPayments[initialPayments.length - 1].id : null,
  );
  const [hasMore, setHasMore] = useState(initialPayments.length < totalCount);
  const [total, setTotal] = useState(totalCount);
  const [loading, setLoading] = useState(false);

  // Refund dialog state
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };

  const fetchPayments = useCallback(
    async (status: string, append = false, cursorId?: string | null) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (append && cursorId) params.set('cursor', cursorId);

        const res = await fetch(`/api/admin/payments?${params}`);
        const data = await res.json();

        if (data.success) {
          if (append) {
            setPayments((prev) => [...prev, ...data.data.items]);
          } else {
            setPayments(data.data.items);
          }
          setCursor(data.data.nextCursor);
          setHasMore(data.data.hasMore);
          setTotal(data.data.totalCount);
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    fetchPayments(status);
  };

  const handleLoadMore = () => {
    fetchPayments(statusFilter, true, cursor);
  };

  const handleExportCsv = () => {
    const headers = [
      'Date',
      'User',
      'Email',
      'Plan',
      'Net',
      'VAT',
      'Total',
      'Status',
      'Gateway Ref',
    ];
    const rows = payments.map((p) => [
      format(new Date(p.createdAt), 'yyyy-MM-dd HH:mm'),
      p.user.name,
      p.user.email,
      p.subscription?.plan.nameEn || 'One-off',
      (p.amount / 100).toFixed(2),
      (p.vatAmount / 100).toFixed(2),
      ((p.amount + p.vatAmount) / 100).toFixed(2),
      p.status,
      p.gatewayRef || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefund = async (paymentId: string) => {
    setRefundLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: refundReason,
          ...(refundAmount ? { amount: parseInt(refundAmount, 10) } : {}),
        }),
      });

      if (res.ok) {
        setRefundingId(null);
        setRefundReason('');
        setRefundAmount('');
        // Refresh the list
        fetchPayments(statusFilter);
      }
    } finally {
      setRefundLoading(false);
    }
  };

  const totalRevenue = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount + p.vatAmount, 0);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="border-border bg-background rounded-md border px-3 py-2 text-sm"
        >
          <option value="">{t('allStatuses')}</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <Button variant="outline" size="sm" onClick={handleExportCsv}>
          <Download className="h-4 w-4" />
          {t('exportCsv')}
        </Button>

        <div className="text-muted-foreground ms-auto text-sm">
          {t('totalRevenue')}: {formatCurrency(totalRevenue, 'ILS')}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('date')}</TableHead>
              <TableHead>{t('user')}</TableHead>
              <TableHead>{t('planItem')}</TableHead>
              <TableHead className="text-right">{t('amount')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('gatewayRef')}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  {t('noPayments')}
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm">{format(new Date(p.createdAt), 'MMM d, yyyy')}</div>
                    <div className="text-muted-foreground text-xs">
                      {format(new Date(p.createdAt), 'HH:mm')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{p.user.name}</div>
                    <div className="text-muted-foreground text-xs">{p.user.email}</div>
                  </TableCell>
                  <TableCell>
                    {p.subscription ? (
                      <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs">
                        {p.subscription.plan.nameEn}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">{t('oneOff')}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(p.amount + p.vatAmount, p.currency)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${STATUS_COLORS[p.status] || 'border'}`}
                    >
                      {p.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                      {p.gatewayRef || t('na')}
                    </span>
                  </TableCell>
                  <TableCell>
                    {p.status === 'COMPLETED' && (
                      <>
                        {refundingId === p.id ? (
                          <div className="min-w-[200px] space-y-2">
                            <Input
                              placeholder={t('refundReason')}
                              value={refundReason}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setRefundReason(e.target.value)
                              }
                              className="text-xs"
                            />
                            <Input
                              placeholder={t('refundAmount')}
                              value={refundAmount}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setRefundAmount(e.target.value)
                              }
                              type="number"
                              className="text-xs"
                            />
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRefund(p.id)}
                                disabled={!refundReason || refundLoading}
                              >
                                {refundLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                                {t('refundConfirm')}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setRefundingId(null)}
                              >
                                &times;
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setRefundingId(p.id);
                              setRefundReason('');
                              setRefundAmount('');
                            }}
                          >
                            <RefreshCw className="h-3 w-3" />
                            {t('refund')}
                          </Button>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {t('showing', { count: payments.length, total })}
        </span>
        {hasMore && (
          <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('loadMore')}
          </Button>
        )}
      </div>
    </div>
  );
}
