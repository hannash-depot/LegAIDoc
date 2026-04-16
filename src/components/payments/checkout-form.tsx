'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Loader2, CreditCard } from 'lucide-react';

interface PlanData {
  id: string;
  slug: string;
  nameHe: string;
  nameAr: string;
  nameEn: string;
  nameRu: string;
  priceIls: number; // agorot
  features: string[];
}

interface CheckoutFormProps {
  plans: PlanData[];
  initialPlanId?: string;
}

export function CheckoutForm({ plans, initialPlanId }: CheckoutFormProps) {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(initialPlanId ?? null);
  const [installments, setInstallments] = useState(1);
  const [vatNumber, setVatNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const formatIls = (agorot: number) => `₪${(agorot / 100).toFixed(2)}`;

  const nameKey = `name${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof PlanData;

  const handleCheckout = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          installments,
          customerVatNumber: vatNumber || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/documents' as '/templates'), 2000);
      } else {
        setError(data.error?.message || t('paymentFailed'));
      }
    } catch {
      setError(t('paymentFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 rounded-full bg-green-100 p-3 dark:bg-green-900/30">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-lg font-medium">{t('paymentSuccess')}</p>
          <p className="text-muted-foreground mt-1 text-sm">{t('redirecting')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Selection */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all ${isSelected ? 'ring-primary shadow-lg ring-2' : 'hover:shadow-md'}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{plan[nameKey] as string}</CardTitle>
                <p className="text-3xl font-bold">
                  {formatIls(plan.priceIls)}
                  <span className="text-muted-foreground text-sm font-normal">
                    /{t('perMonth')}
                  </span>
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-5 w-5" />
              {t('paymentDetails')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Installments */}
            {(() => {
              const plan = plans.find((p) => p.id === selectedPlan);
              const gross = plan ? Math.round(plan.priceIls * 1.17) : 0;
              if (gross < 50000) return null; // < 500 NIS
              return (
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('installments')}</label>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                    className="border-border bg-background w-full rounded-md border px-3 py-2"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n === 1 ? t('singlePayment') : `${n} ${t('payments')}`}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })()}

            {/* Price Breakdown */}
            {(() => {
              const plan = plans.find((p) => p.id === selectedPlan);
              if (!plan) return null;
              const net = plan.priceIls;
              const vat = Math.round(net * 0.17);
              const gross = net + vat;
              const perInstallment = installments > 1 ? Math.ceil(gross / installments) : null;

              return (
                <div className="bg-muted/50 space-y-2 rounded-lg border p-4 text-sm">
                  <h4 className="font-medium">{t('priceBreakdown')}</h4>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('subtotal')}</span>
                    <span>{formatIls(net)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('vat')}</span>
                    <span>{formatIls(vat)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>{t('total')}</span>
                    <span>{formatIls(gross)}</span>
                  </div>
                  {perInstallment && (
                    <div className="text-primary flex justify-between">
                      <span>
                        {installments} × {formatIls(perInstallment)}
                      </span>
                      <span className="text-muted-foreground">{t('perInstallment')}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* VAT Number (B2B) */}
            <div className="space-y-1.5">
              <label className="text-foreground block text-sm font-medium">{t('vatNumber')}</label>
              <Input
                value={vatNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVatNumber(e.target.value)}
                placeholder={t('vatPlaceholder')}
              />
            </div>

            <p className="text-muted-foreground text-xs">{t('vatNote')}</p>

            {error && (
              <div
                className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
                role="alert"
              >
                {error}
              </div>
            )}

            <Button className="w-full" onClick={handleCheckout} disabled={isProcessing}>
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {t('payButton')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
