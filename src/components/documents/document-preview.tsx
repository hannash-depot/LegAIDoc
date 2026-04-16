'use client';

import { useState, useMemo } from 'react';
import { clientLogger } from '@/lib/client-logger';
import { Button } from '@/components/ui/button';
import { Lock, CreditCard, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DocumentPreviewProps {
  truncatedHtml: string;
  documentId: string;
}

function createWatermarkSvg(text: string): string {
  // SVG with rotated, repeating watermark text
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250"><text transform="rotate(-35 200 125)" x="200" y="125" font-family="Arial,sans-serif" font-size="18" fill="black" text-anchor="middle" opacity="1">${escaped}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function DocumentPreview({ truncatedHtml, documentId }: DocumentPreviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('documents');

  const watermarkUrl = useMemo(() => createWatermarkSvg(t('watermarkText')), [t]);

  async function handlePurchase() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/payments/checkout-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });

      const data = await res.json();

      if (data.success && data.data.free) {
        window.location.reload();
        return;
      }

      if (data.success && data.data.url) {
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

  return (
    <div className="relative">
      {/* Watermarked, non-selectable document content */}
      <div
        className="relative overflow-hidden select-none"
        style={{
          backgroundImage: `url("${watermarkUrl}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '400px 250px',
        }}
        onCopy={(e) => e.preventDefault()}
      >
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: truncatedHtml }}
        />

        {/* Gradient fade at the bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-gray-950 dark:via-gray-950/80" />
      </div>

      {/* Purchase CTA */}
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <Lock className="text-muted-foreground h-10 w-10" />
        <h3 className="text-lg font-semibold">{t('previewLockedTitle')}</h3>
        <p className="text-muted-foreground max-w-md text-sm">{t('previewLockedDescription')}</p>
        <Button onClick={handlePurchase} disabled={isLoading} size="lg">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          {t('purchaseToUnlock')}
        </Button>
      </div>
    </div>
  );
}
