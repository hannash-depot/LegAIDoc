'use client';

import { useState } from 'react';
import { clientLogger } from '@/lib/client-logger';
import { Button } from '@/components/ui/button';
import { Download, CreditCard, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FEATURE_PAYMENTS } from '@/lib/feature-flags';

interface DocumentDownloadButtonProps {
  documentId: string;
  status: string;
  isPaid: boolean;
}

export function DocumentDownloadButton({ documentId, isPaid }: DocumentDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('documents');

  // When payments are disabled, treat all documents as paid (free download)
  const effectivelyPaid = !FEATURE_PAYMENTS || isPaid;

  async function handleClick() {
    if (effectivelyPaid) {
      // Direct download
      window.location.href = `/api/documents/${documentId}/pdf`;
      return;
    }

    // Initiate checkout
    setIsLoading(true);
    try {
      const res = await fetch('/api/payments/checkout-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });

      const data = await res.json();

      if (data.success && data.data.free) {
        // First document was free — reload to show updated status
        window.location.reload();
        return;
      }

      if (data.success && data.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.data.url;
        return;
      }

      clientLogger.error('Checkout failed', data.error);
    } catch (err) {
      clientLogger.error('Checkout error', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (effectivelyPaid) {
    return (
      <Button onClick={handleClick}>
        <Download className="h-4 w-4" />
        {t('downloadPdf')}
      </Button>
    );
  }

  return (
    <Button onClick={handleClick} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="h-4 w-4" />
      )}
      {t('purchaseAndDownload')}
    </Button>
  );
}
